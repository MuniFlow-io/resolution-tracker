import AdmZip from "adm-zip";

export function assembleDocx(rawZip: AdmZip, modifiedXmlString: string): Buffer {
  rawZip.updateFile("word/document.xml", Buffer.from(modifiedXmlString, "utf8"));
  return rawZip.toBuffer();
}

