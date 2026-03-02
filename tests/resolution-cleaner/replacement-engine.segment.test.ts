import assert from "node:assert/strict";
import { test } from "node:test";
import AdmZip from "adm-zip";
import { parseDocx } from "@/lib/services/resolution-cleaner/parseDocx";
import { applyReplacements } from "@/lib/services/resolution-cleaner/replacementEngine";
import { assembleDocx } from "@/lib/services/resolution-cleaner/assembleDocx";

function buildMinimalDocx(documentXml: string): Buffer {
  const zip = new AdmZip();
  zip.addFile(
    "[Content_Types].xml",
    Buffer.from(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`,
      "utf8",
    ),
  );
  zip.addFile(
    "_rels/.rels",
    Buffer.from(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
      "utf8",
    ),
  );
  zip.addFile(
    "word/_rels/document.xml.rels",
    Buffer.from(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`,
      "utf8",
    ),
  );
  zip.addFile(
    "word/styles.xml",
    Buffer.from(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"/>`,
      "utf8",
    ),
  );
  zip.addFile("word/document.xml", Buffer.from(documentXml, "utf8"));
  return zip.toBuffer();
}

test("replacement engine segment: deterministic output across repeated runs", () => {
  const xmlString = `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Series 2024-A and Series 2024-A again.</w:t></w:r></w:p></w:body></w:document>`;
  const parsed = parseDocx(buildMinimalDocx(xmlString));

  const target = "Series 2024-A";
  const firstStart = parsed.flatText.indexOf(target);
  const secondStart = parsed.flatText.indexOf(target, firstStart + 1);
  const expected = applyReplacements(parsed.runs, parsed.xmlString, parsed.flatText, [
    {
      group_id: "series-group",
      original_value: target,
      new_value: "Series 2026-C",
      confirmed_occurrence_offsets: [
        { start: firstStart, end: firstStart + target.length },
        { start: secondStart, end: secondStart + target.length },
      ],
      term_key: "series_name",
    },
  ]);

  for (let i = 0; i < 25; i += 1) {
    const actual = applyReplacements(parsed.runs, parsed.xmlString, parsed.flatText, [
      {
        group_id: "series-group",
        original_value: target,
        new_value: "Series 2026-C",
        confirmed_occurrence_offsets: [
          { start: firstStart, end: firstStart + target.length },
          { start: secondStart, end: secondStart + target.length },
        ],
        term_key: "series_name",
      },
    ]);

    assert.equal(actual.modifiedXmlString, expected.modifiedXmlString);
    assert.deepEqual(actual.actualReplacementCounts, expected.actualReplacementCounts);
  }
});

test("docx chain segment: parse -> replace -> assemble keeps package healthy", () => {
  const xmlString = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r><w:t>Borrower: </w:t></w:r>
      <w:r><w:t>Balboa Lee Avenue, L.P.</w:t></w:r>
    </w:p>
  </w:body>
</w:document>`;
  const originalBuffer = buildMinimalDocx(xmlString);
  const parsed = parseDocx(originalBuffer);

  const originalValue = "Balboa Lee Avenue, L.P.";
  const start = parsed.flatText.indexOf(originalValue);
  const end = start + originalValue.length;
  assert.ok(start >= 0, "Target string must be present in parsed flat text");

  const replaced = applyReplacements(parsed.runs, parsed.xmlString, parsed.flatText, [
    {
      group_id: "borrower",
      original_value: originalValue,
      new_value: "Acme Borrower LLC",
      confirmed_occurrence_offsets: [{ start, end }],
      term_key: "borrower_name",
    },
  ]);

  const updatedBuffer = assembleDocx(parsed.rawZip, replaced.modifiedXmlString);

  // Re-parse updated package to assert zip/document.xml remains readable.
  const reparsed = parseDocx(updatedBuffer);
  assert.ok(reparsed.flatText.includes("Acme Borrower LLC"));
  assert.ok(!reparsed.flatText.includes(originalValue));

  // Assert non-target package entries are preserved.
  const updatedZip = new AdmZip(updatedBuffer);
  const stylesXml = updatedZip.readAsText("word/styles.xml");
  assert.ok(stylesXml.includes("<w:styles"));
});
