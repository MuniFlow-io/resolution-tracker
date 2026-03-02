import PizZip from "pizzip";
import { XMLValidator } from "fast-xml-parser";

export interface DocxValidationResult {
  valid: boolean;
  error?: string;
}

const REQUIRED_PARTS = ["[Content_Types].xml", "_rels/.rels", "word/document.xml"] as const;

export function validateDocxBuffer(buffer: Buffer): DocxValidationResult {
  try {
    const zip = new PizZip(buffer);

    for (const part of REQUIRED_PARTS) {
      if (!zip.file(part)) {
        return { valid: false, error: `Missing required DOCX part: ${part}` };
      }
    }

    const documentXml = zip.file("word/document.xml")?.asText() ?? "";
    const relsXml = zip.file("_rels/.rels")?.asText() ?? "";
    const contentTypesXml = zip.file("[Content_Types].xml")?.asText() ?? "";

    const docXmlValid = XMLValidator.validate(documentXml);
    if (docXmlValid !== true) {
      return { valid: false, error: "word/document.xml is not well-formed XML" };
    }

    const relsValid = XMLValidator.validate(relsXml);
    if (relsValid !== true) {
      return { valid: false, error: "_rels/.rels is not well-formed XML" };
    }

    const contentTypesValid = XMLValidator.validate(contentTypesXml);
    if (contentTypesValid !== true) {
      return { valid: false, error: "[Content_Types].xml is not well-formed XML" };
    }

    return { valid: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown DOCX validation error";
    return { valid: false, error: `Invalid DOCX container: ${message}` };
  }
}

