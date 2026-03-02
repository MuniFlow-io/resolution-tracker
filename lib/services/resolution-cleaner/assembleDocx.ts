import PizZip from "pizzip";

/**
 * Writes the modified document.xml back into the zip and generates a clean
 * output buffer.
 *
 * PizZip.generate() re-compresses every entry from scratch, which means the
 * output is always a well-formed ZIP with correct CRC32 values and offsets
 * regardless of whether the source file had DATA_DESCRIPTOR entries (as all
 * Microsoft Word documents do). This is the property that prevents Word from
 * reporting the downloaded file as corrupted.
 */
export function assembleDocx(rawZip: PizZip, modifiedXmlString: string): Buffer {
  // align with BondGenerator: explicitly buffer as UTF-8 to prevent encoding corruption
  const xmlBuffer = Buffer.from(modifiedXmlString, "utf8");
  rawZip.file("word/document.xml", xmlBuffer);
  return rawZip.generate({ type: "nodebuffer", compression: "DEFLATE" });
}
