import PizZip from "pizzip";

/**
 * A RunSegment represents one <w:t> element's text and its exact byte
 * positions inside xmlString. This is the bridge between the flat text
 * the regex engine sees and the XML nodes that need to be modified.
 */
export interface RunSegment {
  /** Char offset in flatText where this segment's text begins (inclusive). */
  flatStart: number;
  /** Char offset in flatText where this segment's text ends (exclusive). */
  flatEnd: number;
  /** Text as human-readable string (XML entities decoded). */
  decodedText: string;
  /** Byte offset in xmlString where the <w:t> content starts (after the >). */
  xmlContentStart: number;
  /** Byte offset in xmlString where the <w:t> content ends (before </w:t>). */
  xmlContentEnd: number;
}

export interface ParsedDocument {
  /** Full document text, built by joining all <w:t> content with paragraph breaks. */
  flatText: string;
  /** Ordered array mapping flatText offsets back to XML byte positions. */
  runs: RunSegment[];
  /** Raw XML string from word/document.xml — used by assembleDocx. */
  xmlString: string;
  /** The loaded PizZip instance — used by assembleDocx to preserve all non-document files. */
  rawZip: PizZip;
}

// Matches every <w:t ...>content</w:t> including empty ones and
// those with xml:space="preserve". Capture group 1 = content.
const W_T_REGEX = /<w:t(?:[^>]*)>([\s\S]*?)<\/w:t>/g;

// Matches paragraph start tags so we know where to insert line breaks.
const W_P_OPEN_REGEX = /<w:p[ >]/g;

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

export function parseDocx(buffer: Buffer): ParsedDocument {
  // Single-engine strategy: parse and reassemble with the same ZIP implementation.
  const rawZip = new PizZip(buffer);
  const xmlFile = rawZip.file("word/document.xml");
  if (!xmlFile) {
    throw new Error("Invalid .docx file — word/document.xml not found");
  }
  const xmlString = xmlFile.asText();

  const runs: RunSegment[] = [];

  // Build a set of paragraph-open byte offsets so we can insert \n between paragraphs.
  const paragraphStarts = new Set<number>();
  W_P_OPEN_REGEX.lastIndex = 0;
  let pm: RegExpExecArray | null = null;
  while ((pm = W_P_OPEN_REGEX.exec(xmlString)) !== null) {
    paragraphStarts.add(pm.index);
  }

  // Walk every <w:t> element in document order.
  // We interleave paragraph-break characters when we cross a paragraph boundary.
  let flatOffset = 0;
  let lastProcessedXmlPos = 0;

  W_T_REGEX.lastIndex = 0;
  let m: RegExpExecArray | null = null;
  while ((m = W_T_REGEX.exec(xmlString)) !== null) {
    const xmlContentStart = m.index + m[0].indexOf(">") + 1;
    const xmlContentEnd = xmlContentStart + m[1].length;
    const encodedText = m[1];
    const decodedText = decodeXmlEntities(encodedText);

    // Check if a paragraph boundary occurred between the last run and this one.
    // If so, insert a newline into flatText to represent the paragraph break.
    for (const pStart of paragraphStarts) {
      if (pStart > lastProcessedXmlPos && pStart < m.index) {
        flatOffset += 1; // the \n we insert into flatText for this paragraph break
      }
    }
    lastProcessedXmlPos = xmlContentEnd;

    if (decodedText.length > 0) {
      runs.push({
        flatStart: flatOffset,
        flatEnd: flatOffset + decodedText.length,
        decodedText,
        xmlContentStart,
        xmlContentEnd,
      });
      flatOffset += decodedText.length;
    }
  }

  // Build flatText by concatenating runs, re-inserting paragraph newlines.
  // We rebuild it cleanly from the run array to guarantee consistency.
  const flatParts: string[] = [];
  let cursor = 0;
  for (const run of runs) {
    // Insert newlines for any paragraph breaks that sit between the previous run and this one.
    if (run.flatStart > cursor) {
      flatParts.push("\n".repeat(run.flatStart - cursor));
    }
    flatParts.push(run.decodedText);
    cursor = run.flatEnd;
  }
  const flatText = flatParts.join("");

  return { flatText, runs, xmlString, rawZip };
}
