import type {
  ConfirmedReplacement,
  ParseResult,
  ServiceResult,
} from "@/modules/resolution-cleaner/types/resolutionData";

async function parseResponse<T>(response: Response): Promise<ServiceResult<T>> {
  const json = (await response.json()) as ServiceResult<T>;
  if (!response.ok || !json.success || !json.data) {
    return { success: false, error: json.error ?? "Request failed" };
  }
  return { success: true, data: json.data };
}

export async function parseResolutionDocx(file: File): Promise<ServiceResult<ParseResult>> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/resolution-cleaner/parse", {
    method: "POST",
    body: formData,
  });

  return parseResponse<ParseResult>(response);
}

export async function applyResolutionReplacements(
  rawFileBase64: string,
  confirmedReplacements: ConfirmedReplacement[],
): Promise<ServiceResult<{ updatedFileBlob: Blob }>> {
  const response = await fetch("/api/resolution-cleaner/replace", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      rawFileBase64,
      confirmedReplacements,
    }),
  });

  if (!response.ok) {
    try {
      const json = (await response.json()) as ServiceResult<never>;
      return { success: false, error: json.error ?? "Request failed" };
    } catch {
      return { success: false, error: "Request failed" };
    }
  }

  const updatedFileBlob = await response.blob();
  return { success: true, data: { updatedFileBlob } };
}

