"use client";

import { useState } from "react";
import { applyResolutionReplacements } from "@/modules/resolution-cleaner/api/resolutionApi";
import type {
  ChangeLogEntry,
  ConfirmedReplacement,
  ConfirmedTerms,
  ServiceResult,
} from "@/modules/resolution-cleaner/types/resolutionData";

export interface UseReplacementResult {
  isReplacing: boolean;
  error: string | null;
  changeLog: ChangeLogEntry[];
  confirmedTerms: ConfirmedTerms;
  updatedFileBlob: Blob | null;
  applyReplacements: (
    rawFileBase64: string,
    replacements: ConfirmedReplacement[],
  ) => Promise<ServiceResult<{ updatedFileBlob: Blob }>>;
  resetReplacement: () => void;
}

export function useReplacement(): UseReplacementResult {
  const [isReplacing, setIsReplacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [changeLog, setChangeLog] = useState<ChangeLogEntry[]>([]);
  const [confirmedTerms, setConfirmedTerms] = useState<ConfirmedTerms>({});
  const [updatedFileBlob, setUpdatedFileBlob] = useState<Blob | null>(null);

  async function applyReplacements(
    rawFileBase64: string,
    replacements: ConfirmedReplacement[],
  ): Promise<ServiceResult<{ updatedFileBlob: Blob }>> {
    setIsReplacing(true);
    setError(null);
    try {
      const result = await applyResolutionReplacements(rawFileBase64, replacements);
      if (!result.success || !result.data) {
        setError(result.error ?? "Replacement failed");
        return { success: false, error: result.error ?? "Replacement failed" };
      }

      setUpdatedFileBlob(result.data.updatedFileBlob);
      // Binary transport path intentionally does not return change log metadata.
      setChangeLog([]);
      setConfirmedTerms({});
      return { success: true, data: { updatedFileBlob: result.data.updatedFileBlob } };
    } catch {
      const fallback = "Replacement failed. Please try again.";
      setError(fallback);
      return { success: false, error: fallback };
    } finally {
      setIsReplacing(false);
    }
  }

  function resetReplacement() {
    setIsReplacing(false);
    setError(null);
    setChangeLog([]);
    setConfirmedTerms({});
    setUpdatedFileBlob(null);
  }

  return {
    isReplacing,
    error,
    changeLog,
    confirmedTerms,
    updatedFileBlob,
    applyReplacements,
    resetReplacement,
  };
}

