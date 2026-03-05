import type {
  ConfirmedReplacement,
  ParseResult,
  ServiceResult,
} from "@/modules/resolution-cleaner/types/resolutionData";

async function parseResponse<T>(response: Response): Promise<ServiceResult<T>> {
  let json: ServiceResult<T> | null = null;
  try {
    json = (await response.json()) as ServiceResult<T>;
  } catch {
    if (!response.ok) {
      return { success: false, error: `Request failed (${response.status})` };
    }
    return { success: false, error: "Unexpected server response" };
  }

  if (!response.ok || !json.success || !json.data) {
    return { success: false, error: json.error ?? `Request failed (${response.status})` };
  }
  return { success: true, data: json.data };
}

export async function parseResolutionDocx(file: File): Promise<ServiceResult<ParseResult>> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/resolution-cleaner/parse", {
      method: "POST",
      body: formData,
    });

    return parseResponse<ParseResult>(response);
  } catch {
    return {
      success: false,
      error: "Could not reach the server. Check your connection and try again.",
    };
  }
}

export async function applyResolutionReplacements(
  file: File,
  confirmedReplacements: ConfirmedReplacement[],
): Promise<ServiceResult<{ updatedFileBlob: Blob }>> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("confirmedReplacements", JSON.stringify(confirmedReplacements));

    const response = await fetch("/api/resolution-cleaner/replace", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      try {
        const json = (await response.json()) as ServiceResult<never>;
        return { success: false, error: json.error ?? `Request failed (${response.status})` };
      } catch {
        return { success: false, error: `Request failed (${response.status})` };
      }
    }

    const updatedFileBlob = await response.blob();
    return { success: true, data: { updatedFileBlob } };
  } catch {
    return {
      success: false,
      error: "Could not reach the server. Check your connection and try again.",
    };
  }
}

