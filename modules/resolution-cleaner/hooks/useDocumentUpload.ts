"use client";

import { useMemo, useState } from "react";
import { parseResolutionDocx } from "@/modules/resolution-cleaner/api/resolutionApi";
import type {
  AppStep,
  ParseResult,
  ServiceResult,
} from "@/modules/resolution-cleaner/types/resolutionData";

export interface UseDocumentUploadResult {
  file: File | null;
  parseResult: ParseResult | null;
  step: AppStep;
  error: string | null;
  setStep: (step: AppStep) => void;
  setError: (error: string | null) => void;
  setFile: (file: File | null) => void;
  handleUpload: (file: File) => Promise<ServiceResult<ParseResult>>;
  resetUpload: () => void;
  canUpload: boolean;
}

export function useDocumentUpload(): UseDocumentUploadResult {
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [step, setStep] = useState<AppStep>("upload");
  const [error, setError] = useState<string | null>(null);

  const canUpload = useMemo(() => !!file && step === "upload", [file, step]);

  async function handleUpload(inputFile: File): Promise<ServiceResult<ParseResult>> {
    setStep("parsing");
    setError(null);

    const result = await parseResolutionDocx(inputFile);
    if (!result.success || !result.data) {
      setStep("upload");
      setError(result.error ?? "Could not parse this document");
      return { success: false, error: result.error ?? "Could not parse this document" };
    }

    setFile(inputFile);
    setParseResult(result.data);
    setStep("review");
    return { success: true, data: result.data };
  }

  function resetUpload() {
    setFile(null);
    setParseResult(null);
    setError(null);
    setStep("upload");
  }

  return {
    file,
    parseResult,
    step,
    error,
    setStep,
    setError,
    setFile,
    handleUpload,
    resetUpload,
    canUpload,
  };
}

