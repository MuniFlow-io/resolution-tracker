"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ChangeLog } from "@/modules/resolution-cleaner/components/ChangeLog";
import { VariableGroupList } from "@/modules/resolution-cleaner/components/VariableGroupList";
import { UploadZone } from "@/modules/resolution-cleaner/components/UploadZone";
import { DocumentPreviewIframe } from "@/modules/resolution-cleaner/components/DocumentPreviewIframe";
import { useDocumentUpload } from "@/modules/resolution-cleaner/hooks/useDocumentUpload";
import { useReplacement } from "@/modules/resolution-cleaner/hooks/useReplacement";
import { useVariableGroups } from "@/modules/resolution-cleaner/hooks/useVariableGroups";
import { useBiDirectionalSync } from "@/modules/resolution-cleaner/hooks/useBiDirectionalSync";
import type { VariableType } from "@/modules/resolution-cleaner/types/resolutionData";

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
  const [collapsedByType, setCollapsedByType] = useState<Partial<Record<VariableType, boolean>>>({});
  const previewContainerRef = useRef<HTMLDivElement>(null);
  
  const sync = useBiDirectionalSync({
    groups: groups.groups,
    onIgnore: groups.ignoreGroup,
    onUndo: groups.undoGroup,
    setReplacementValue: groups.setReplacementValue,
    confirmReplacement: groups.confirmGroupReplacement,
  });

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
    if (!replacement.updatedFileBlob || !upload.parseResult?.fileName) return;
    const url = URL.createObjectURL(replacement.updatedFileBlob);
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
    sync.handleClosePanel();
    setCollapsedByType({});
  }

  const isReviewMode = upload.step === "review" && upload.parseResult;
  const isCompleteMode = upload.step === "complete";
  const actionableGroups = groups.groups.filter((group) => !group.is_locked);
  const unresolvedGroups = actionableGroups
    .filter((group) => group.action !== "done" && group.action !== "ignored")
    .sort(
      (a, b) =>
        (a.occurrences[0]?.start_offset ?? Number.MAX_SAFE_INTEGER) -
          (b.occurrences[0]?.start_offset ?? Number.MAX_SAFE_INTEGER) ||
        a.detected_value_raw.localeCompare(b.detected_value_raw),
    );
  const navigatorGroups = [...actionableGroups].sort(
    (a, b) =>
      (a.occurrences[0]?.start_offset ?? Number.MAX_SAFE_INTEGER) -
        (b.occurrences[0]?.start_offset ?? Number.MAX_SAFE_INTEGER) ||
      a.detected_value_raw.localeCompare(b.detected_value_raw),
  );
  const activeGroup =
    groups.groups.find((group) => group.group_id === sync.activeGroupId) ?? unresolvedGroups[0] ?? null;
  const activeOccurrenceTotal = activeGroup?.occurrences.length ?? 0;

  function toggleSection(type: VariableType) {
    setCollapsedByType((prev) => ({ ...prev, [type]: !(prev[type] ?? false) }));
  }

  function focusPreviewPane() {
    previewContainerRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  function handleNavigatorSelect(groupId: string) {
    sync.handleStartPreview(groupId);
    sync.setActiveOccurrenceIndex(0);
    focusPreviewPane();
  }

  function cycleGroup(direction: 1 | -1) {
    if (navigatorGroups.length === 0) return;
    const ids = navigatorGroups.map((group) => group.group_id);
    const currentIndex = activeGroup ? ids.indexOf(activeGroup.group_id) : -1;
    const nextIndex = currentIndex < 0 ? 0 : (currentIndex + direction + ids.length) % ids.length;
    handleNavigatorSelect(ids[nextIndex]);
  }

  function cycleOccurrence(direction: 1 | -1) {
    if (!activeGroup || activeOccurrenceTotal <= 1) return;
    const current = sync.activeOccurrenceIndex;
    const next = (current + direction + activeOccurrenceTotal) % activeOccurrenceTotal;
    sync.setActiveOccurrenceIndex(next);
    focusPreviewPane();
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
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
      <header className="mb-8 max-w-3xl">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Resolution Cleaner</h1>
        <p className="mt-1 text-sm text-gray-400">
          Upload a resolution to detect and replace deal-specific variables.
        </p>
      </header>

      {/* ── Step: upload ─────────────────────────────────────── */}
      {upload.step === "upload" ? (
        <div className="max-w-3xl">
          <UploadZone onFileSelected={handleFileSelected} error={upload.error} />
        </div>
      ) : null}

      {/* ── Step: parsing skeleton ───────────────────────────── */}
      {upload.step === "parsing" ? (
        <div className="max-w-3xl">
          <ParsingSkeleton label={`Parsing ${upload.parseResult?.fileName ?? "document"}…`} />
        </div>
      ) : null}

      {/* ── Step: review (Split Pane on Desktop) ─────────────── */}
      {isReviewMode ? (
        <div className="space-y-4 lg:space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
            {/* Preview-first pane */}
            <div ref={previewContainerRef} className="h-[60vh] lg:sticky lg:top-4 lg:h-[calc(100vh-180px)]">
              <DocumentPreviewIframe
                html={upload.parseResult!.previewHtml}
                activeGroupId={activeGroup?.group_id ?? null}
                activeOccurrenceIndex={sync.activeOccurrenceIndex}
                onHighlightClick={sync.handleHighlightClick}
                replacements={sync.confirmedReplacements}
              />
            </div>

            {/* Sidebar control pane */}
            <div className="space-y-4">
              <Card className="space-y-3">
                <p className="text-sm font-medium text-gray-200">{upload.parseResult!.fileName}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-md border border-gray-800 bg-gray-900/50 px-2 py-1.5">
                    <p className="text-gray-400">Detected</p>
                    <p className="font-medium text-white">{actionableGroups.length}</p>
                  </div>
                  <div className="rounded-md border border-gray-800 bg-gray-900/50 px-2 py-1.5">
                    <p className="text-gray-400">Remaining</p>
                    <p className="font-medium text-amber-300">{unresolvedGroups.length}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-gray-500">
                    Active Field
                  </label>
                  <select
                    className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100"
                    value={activeGroup?.group_id ?? ""}
                    onChange={(e) => handleNavigatorSelect(e.target.value)}
                  >
                    {navigatorGroups.length === 0 ? (
                      <option value="">No variables</option>
                    ) : (
                      navigatorGroups.map((group) => (
                        <option key={group.group_id} value={group.group_id}>
                          {group.type.replace("_", " ")}: {group.detected_value_raw}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="secondary" size="sm" onClick={() => cycleGroup(-1)} disabled={navigatorGroups.length < 2}>
                    Previous Field
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => cycleGroup(1)} disabled={navigatorGroups.length < 2}>
                    Next Field
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => cycleOccurrence(-1)}
                    disabled={activeOccurrenceTotal <= 1}
                  >
                    Previous Occurrence
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => cycleOccurrence(1)}
                    disabled={activeOccurrenceTotal <= 1}
                  >
                    Next Occurrence
                  </Button>
                </div>
                <div className="text-xs text-gray-400">
                  {activeGroup
                    ? `Reviewing "${activeGroup.detected_value_raw}" — occurrence ${Math.min(sync.activeOccurrenceIndex + 1, activeOccurrenceTotal)} of ${activeOccurrenceTotal}`
                    : "No active field selected"}
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => activeGroup && sync.handleStartReplace(activeGroup.group_id)}
                    disabled={!activeGroup}
                  >
                    Replace Active
                  </Button>
                </div>

                <div className="space-y-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleApplyAll}
                    disabled={groups.confirmedCount === 0 || replacement.isReplacing}
                    className="w-full"
                  >
                    {replacement.isReplacing ? "Applying…" : `Apply All Confirmed (${groups.confirmedCount})`}
                  </Button>
                  <p className="text-xs text-gray-500">
                    We only replace exact confirmed text and preserve literal values.
                  </p>
                </div>
              </Card>

              <VariableGroupList
                groups={groups.groups}
                filter="all"
                collapsedByType={collapsedByType}
                onToggleSection={toggleSection}
                onPreview={sync.handleStartPreview}
                onStartReplace={sync.handleStartReplace}
                onIgnore={(id) => groups.ignoreGroup(id)}
                onUndo={(id) => groups.undoGroup(id)}
                previewGroupId={sync.previewGroupId}
                previewOccurrenceIndex={sync.activeOccurrenceIndex}
                onPreviewClose={sync.handleClosePanel}
                onPreviewPrev={() =>
                  sync.setActiveOccurrenceIndex(
                    Math.max(0, sync.activeOccurrenceIndex - 1),
                  )
                }
                onPreviewNext={() => {
                  const grp = groups.groups.find((g) => g.group_id === sync.previewGroupId);
                  if (!grp) return;
                  sync.setActiveOccurrenceIndex(
                    Math.min(grp.occurrences.length - 1, sync.activeOccurrenceIndex + 1),
                  );
                }}
                onPreviewToggleExclude={(groupId, idx) =>
                  groups.toggleOccurrenceExcluded(groupId, idx)
                }
                replaceGroupId={sync.replaceGroupId}
                onReplaceConfirm={(groupId, value) => {
                  groups.setReplacementValue(groupId, value);
                  groups.confirmGroupReplacement(groupId);
                  sync.handleClosePanel();
                }}
                onReplaceCancel={sync.handleClosePanel}
              />

              {replacement.error ? (
                <Card className="border-red-800/50 bg-red-950/20">
                  <p className="text-sm text-red-300">{replacement.error}</p>
                </Card>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Step: replacing skeleton ──────────────────────────── */}
      {upload.step === "replacing" ? (
        <div className="max-w-3xl">
          <ParsingSkeleton label="Applying replacements…" />
        </div>
      ) : null}

      {/* ── Step: complete ───────────────────────────────────── */}
      {isCompleteMode ? (
        <div className="max-w-3xl space-y-5">
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
