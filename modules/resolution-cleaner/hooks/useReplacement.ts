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
  updatedFileBase64: string | null;
  applyReplacements: (
    rawFileBase64: string,
    replacements: ConfirmedReplacement[],
  ) => Promise<ServiceResult<{ updatedFileBase64: string }>>;
  resetReplacement: () => void;
}

export function useReplacement(): UseReplacementResult {
  const [isReplacing, setIsReplacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [changeLog, setChangeLog] = useState<ChangeLogEntry[]>([]);
  const [confirmedTerms, setConfirmedTerms] = useState<ConfirmedTerms>({});
  const [updatedFileBase64, setUpdatedFileBase64] = useState<string | null>(null);

  async function applyReplacements(
    rawFileBase64: string,
    replacements: ConfirmedReplacement[],
  ): Promise<ServiceResult<{ updatedFileBase64: string }>> {
    setIsReplacing(true);
    setError(null);

    const result = await applyResolutionReplacements(rawFileBase64, replacements);
    setIsReplacing(false);

    if (!result.success || !result.data) {
      setError(result.error ?? "Replacement failed");
      return { success: false, error: result.error ?? "Replacement failed" };
    }

    setUpdatedFileBase64(result.data.updatedFileBase64);
    setChangeLog(result.data.changeLog);
    setConfirmedTerms(result.data.confirmedTerms);
    return { success: true, data: { updatedFileBase64: result.data.updatedFileBase64 } };
  }

  function resetReplacement() {
    setIsReplacing(false);
    setError(null);
    setChangeLog([]);
    setConfirmedTerms({});
    setUpdatedFileBase64(null);
  }

  return {
    isReplacing,
    error,
    changeLog,
    confirmedTerms,
    updatedFileBase64,
    applyReplacements,
    resetReplacement,
  };
}

