import type { NextApiRequest, NextApiResponse } from "next";
import fs from "node:fs";
import formidable from "formidable";
import { withRequestId } from "@/lib/middleware/withRequestId";
import { logger } from "@/lib/logger";
import { parseDocx } from "@/lib/services/resolution-cleaner/parseDocx";
import { detectVariables } from "@/lib/services/resolution-cleaner/detectVariables";
import { generatePreviewHtml } from "@/lib/services/resolution-cleaner/generatePreviewHtml";
import type { ParseResult, ServiceResult } from "@/modules/resolution-cleaner/types/resolutionData";

export const config = {
  api: {
    bodyParser: false,
  },
};

function parseForm(req: NextApiRequest) {
  const form = formidable({
    maxFileSize: 10 * 1024 * 1024,
    multiples: false,
  });

  return new Promise<formidable.Files>((resolve, reject) => {
    form.parse(req, (error, _fields, files) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(files);
    });
  });
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ServiceResult<ParseResult>>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const files = await parseForm(req);
    const fileItem = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!fileItem) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    if (!fileItem.originalFilename?.toLowerCase().endsWith(".docx")) {
      return res.status(400).json({ success: false, error: "Only .docx files are supported" });
    }

    const fileBuffer = fs.readFileSync(fileItem.filepath);
    const parsed = parseDocx(fileBuffer);
    const variableGroups = detectVariables(parsed.flatText);
    const previewHtml = await generatePreviewHtml(fileBuffer, variableGroups);

    logger.info("Resolution parsed", {
      fileName: fileItem.originalFilename,
      groupCount: variableGroups.length,
    });

    return res.status(200).json({
      success: true,
      data: {
        fileName: fileItem.originalFilename,
        variableGroups,
        rawFileBase64: fileBuffer.toString("base64"),
        previewHtml,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Parse failed";
    logger.error("Resolution parse failed", { error: message });
    return res.status(500).json({ success: false, error: message });
  }
}

export default withRequestId(handler);

