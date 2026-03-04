import JSZip from "jszip";

export async function assembleDocx(fileBuffer: Buffer, modifiedXmlString: string): Promise<Buffer> {
  const zip = await JSZip.loadAsync(fileBuffer);
  zip.file("word/document.xml", modifiedXmlString);
  return zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: {
      level: 6,
    },
  });
}
