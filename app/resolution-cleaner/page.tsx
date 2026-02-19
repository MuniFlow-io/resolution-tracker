"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";
import { ChangeLog } from "@/modules/resolution-cleaner/components/ChangeLog";
import { VariableGroupList } from "@/modules/resolution-cleaner/components/VariableGroupList";
import { UploadZone } from "@/modules/resolution-cleaner/components/UploadZone";
import { useDocumentUpload } from "@/modules/resolution-cleaner/hooks/useDocumentUpload";
import { useReplacement } from "@/modules/resolution-cleaner/hooks/useReplacement";
import { useVariableGroups } from "@/modules/resolution-cleaner/hooks/useVariableGroups";

function ParsingSkeleton({ label }: { label: string }) {
  return (
    <Card className="space-y-6">
      <p className="text-sm text-gray-400">{label}</p>
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-gray-500">Dates</p>
        <Skeleton className="h-12 w-full" />
      </div>
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-gray-500">Dollar Amounts</p>
        <Skeleton className="h-12 w-full" />
      </div>
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-gray-500">Parties</p>
        <Skeleton className="h-12 w-full" />
      </div>
    </Card>
  );
}

export default function ResolutionCleanerPage() {
  const upload = useDocumentUpload();
  const groups = useVariableGroups();
  const replacement = useReplacement();
  const [replaceGroupId, setReplaceGroupId] = useState<string | null>(null);

  /* ── Mutual exclusion: opening one panel closes the other ─── */
  function handlePreview(groupId: string) {
    setReplaceGroupId(null);
    groups.setSelectedGroupId(groupId);
    groups.setSelectedOccurrenceIndex(0);
  }

  function handleStartReplace(groupId: string) {
    groups.setSelectedGroupId(null);
    setReplaceGroupId(groupId);
  }

  /* ── File upload ─────────────────────────────────────────── */
  async function handleFileSelected(file: File) {
    if (!file.name.toLowerCase().endsWith(".docx")) {
      upload.setError("Only .docx files are supported");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      upload.setError("File exceeds 10MB. Please upload a smaller .docx file.");
      return;
    }
    const result = await upload.handleUpload(file);
    if (result.success && result.data) {
      groups.setGroupsFromParse(result.data.variableGroups);
    }
  }

  /* ── Apply all confirmed replacements ───────────────────── */
  async function handleApplyAll() {
    if (!upload.parseResult?.rawFileBase64) return;
    const replacements = groups.buildConfirmedReplacements();
    if (replacements.length === 0) return;

    upload.setStep("replacing");
    const result = await replacement.applyReplacements(
      upload.parseResult.rawFileBase64,
      replacements,
    );

    if (!result.success) {
      upload.setStep("review");
      return;
    }

    upload.setStep("complete");
  }

  /* ── Download ────────────────────────────────────────────── */
  function handleDownload() {
    if (!replacement.updatedFileBase64 || !upload.parseResult?.fileName) return;
    const bytes = atob(replacement.updatedFileBase64);
    const byteArray = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i += 1) byteArray[i] = bytes.charCodeAt(i);

    const blob = new Blob([byteArray], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = upload.parseResult.fileName.replace(".docx", "_updated.docx");
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ── Reset ───────────────────────────────────────────────── */
  function resetAll() {
    upload.resetUpload();
    replacement.resetReplacement();
    groups.setGroupsFromParse([]);
    groups.setSelectedGroupId(null);
    setReplaceGroupId(null);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      {/* ── Back link ────────────────────────────────────────── */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg px-2 text-sm text-gray-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Hub
        </Link>
      </div>

      {/* ── Page header ──────────────────────────────────────── */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Resolution Cleaner</h1>
        <p className="mt-1 text-sm text-gray-400">
          Upload a resolution to detect and replace deal-specific variables.
        </p>
      </header>

      {/* ── Step: upload ─────────────────────────────────────── */}
      {upload.step === "upload" ? (
        <UploadZone onFileSelected={handleFileSelected} error={upload.error} />
      ) : null}

      {/* ── Step: parsing skeleton ───────────────────────────── */}
      {upload.step === "parsing" ? (
        <ParsingSkeleton label={`Parsing ${upload.parseResult?.fileName ?? "document"}…`} />
      ) : null}

      {/* ── Step: review ─────────────────────────────────────── */}
      {upload.step === "review" && upload.parseResult ? (
        <>
          <div className="space-y-5">
            {/* File summary */}
            <Card className="space-y-1">
              <p className="text-sm font-medium text-gray-200">{upload.parseResult.fileName}</p>
              <p className="text-xs text-gray-500">
                {groups.groups.length} variable group{groups.groups.length !== 1 ? "s" : ""} detected
              </p>
            </Card>

            {/* Variable group list — Preview and Replace panels render inline */}
            <VariableGroupList
              groups={groups.groups}
              onPreview={handlePreview}
              onStartReplace={handleStartReplace}
              onIgnore={(id) => groups.ignoreGroup(id)}
              onUndo={(id) => groups.undoGroup(id)}
              previewGroupId={groups.selectedGroupId}
              previewOccurrenceIndex={groups.selectedOccurrenceIndex}
              onPreviewClose={() => groups.setSelectedGroupId(null)}
              onPreviewPrev={() =>
                groups.setSelectedOccurrenceIndex(
                  Math.max(0, groups.selectedOccurrenceIndex - 1),
                )
              }
              onPreviewNext={() => {
                const grp = groups.groups.find((g) => g.group_id === groups.selectedGroupId);
                if (!grp) return;
                groups.setSelectedOccurrenceIndex(
                  Math.min(grp.occurrences.length - 1, groups.selectedOccurrenceIndex + 1),
                );
              }}
              onPreviewToggleExclude={(groupId, idx) =>
                groups.toggleOccurrenceExcluded(groupId, idx)
              }
              replaceGroupId={replaceGroupId}
              onReplaceConfirm={(groupId, value) => {
                groups.setReplacementValue(groupId, value);
                groups.confirmGroupReplacement(groupId);
                setReplaceGroupId(null);
              }}
              onReplaceCancel={() => setReplaceGroupId(null)}
            />

            {/* Replacement API error */}
            {replacement.error ? (
              <Card className="border-red-800/50 bg-red-950/20">
                <p className="text-sm text-red-300">{replacement.error}</p>
              </Card>
            ) : null}

            {/* Apply button — desktop */}
            <div className="hidden space-y-2 sm:block">
              <Button
                variant="primary"
                size="md"
                onClick={handleApplyAll}
                disabled={groups.confirmedCount === 0 || replacement.isReplacing}
              >
                {replacement.isReplacing ? (
                  <>
                    <Spinner className="mr-2" />
                    Applying…
                  </>
                ) : (
                  `Apply All Confirmed (${groups.confirmedCount})`
                )}
              </Button>
              <p className="text-xs text-gray-500">
                We only replace the exact text you confirm. We do not rewrite any language.
              </p>
            </div>
          </div>

          {/* Apply button — mobile sticky bar */}
          <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-800 bg-gray-950 p-4 sm:hidden">
            <Button
              variant="primary"
              size="md"
              onClick={handleApplyAll}
              disabled={groups.confirmedCount === 0 || replacement.isReplacing}
              className="w-full"
            >
              {replacement.isReplacing ? (
                <>
                  <Spinner className="mr-2" />
                  Applying…
                </>
              ) : (
                `Apply All Confirmed (${groups.confirmedCount})`
              )}
            </Button>
            <p className="mt-2 text-center text-xs text-gray-500">
              We only replace the exact text you confirm.
            </p>
          </div>

          {/* Bottom padding so sticky bar doesn't cover last item on mobile */}
          <div className="h-24 sm:hidden" aria-hidden="true" />
        </>
      ) : null}

      {/* ── Step: replacing skeleton ──────────────────────────── */}
      {upload.step === "replacing" ? (
        <ParsingSkeleton label="Applying replacements…" />
      ) : null}

      {/* ── Step: complete ───────────────────────────────────── */}
      {upload.step === "complete" ? (
        <div className="space-y-5">
          <Card className="space-y-3 border-green-800/40 bg-green-950/10">
            <p className="text-sm font-medium text-green-300">Complete</p>
            <p className="text-sm text-gray-300">
              {upload.parseResult?.fileName?.replace(".docx", "_updated.docx")}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="primary" onClick={handleDownload}>
                Download .docx
              </Button>
              <Button variant="ghost" onClick={resetAll}>
                Process Another Document
              </Button>
            </div>
          </Card>

          <ChangeLog entries={replacement.changeLog} />
        </div>
      ) : null}
    </main>
  );
}
