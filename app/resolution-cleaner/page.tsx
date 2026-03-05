"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ChangeLog } from "@/modules/resolution-cleaner/components/ChangeLog";
import { VariableGroupList, type ViewMode } from "@/modules/resolution-cleaner/components/VariableGroupList";
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
  const [viewMode, setViewMode] = useState<ViewMode>("document");
  const [feedback, setFeedback] = useState<string | null>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const feedbackTimerRef = useRef<number | null>(null);
  
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
    if (!upload.file) return;
    const replacements = groups.buildConfirmedReplacements();
    if (replacements.length === 0) return;

    upload.setStep("replacing");
    try {
      const result = await replacement.applyReplacements(
        upload.file,
        replacements,
      );
      if (!result.success) {
        upload.setStep("review");
        return;
      }

      upload.setStep("complete");
    } catch {
      upload.setError("Could not apply replacements right now. Please try again.");
      upload.setStep("review");
    }
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
    setViewMode("document");
    setFeedback(null);
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
  const activeGroupPosition = activeGroup
    ? Math.max(
        0,
        navigatorGroups.findIndex((group) => group.group_id === activeGroup.group_id),
      ) + 1
    : 0;

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current !== null) {
        window.clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  function handleFeedback(msg: string, durationMs = 5000) {
    if (feedbackTimerRef.current !== null) {
      window.clearTimeout(feedbackTimerRef.current);
    }
    setFeedback(msg);
    feedbackTimerRef.current = window.setTimeout(() => {
      setFeedback(null);
      feedbackTimerRef.current = null;
    }, durationMs);
  }

  function handleReplaceConfirm(groupId: string, value: string) {
    // 1. Update replacement state
    groups.setReplacementValue(groupId, value);
    groups.confirmGroupReplacement(groupId);
    sync.handleClosePanel();

    // 2. Feedback
    const group = groups.groups.find((g) => g.group_id === groupId);
    const appliedCount =
      group?.occurrenceStates.filter((occ) => occ.status !== "excluded").length ?? 0;
    const replacementValue = value.trim();
    handleFeedback(
      `${appliedCount} of ${appliedCount} occurrences replaced (${group?.detected_value_raw ?? "value"} -> ${replacementValue})`,
    );

    // 3. Auto-advance logic: find next unresolved group in document order
    // Note: navigatorGroups is stale here (reflects state before confirm), so we skip the current group manually
    const allIds = navigatorGroups.map((g) => g.group_id);
    const currentIndex = allIds.indexOf(groupId);
    
    let nextIndex = -1;
    // Look forward for the next actionable group
    for (let i = 1; i < allIds.length; i++) {
      const idx = (currentIndex + i) % allIds.length;
      const g = navigatorGroups[idx];
      
      // Skip the group we just confirmed
      if (g.group_id === groupId) continue;
      
      // Skip if already processed or locked
      if (!g.is_locked && g.action !== "done" && g.action !== "ignored") {
        nextIndex = idx;
        break;
      }
    }

    if (nextIndex !== -1) {
      handleNavigatorSelect(navigatorGroups[nextIndex].group_id);
      return;
    }

    handleFeedback("All unresolved values are complete.", 3500);
  }

  function toggleSection(type: VariableType) {
    setCollapsedByType((prev) => ({ ...prev, [type]: !(prev[type] ?? false) }));
  }

  function focusPreviewPane() {
    if (window.matchMedia("(min-width: 1024px)").matches) return;
    previewContainerRef.current?.scrollIntoView({ block: "start", behavior: "auto" });
  }

  function handleNavigatorSelect(groupId: string) {
    sync.handleStartPreview(groupId);
    sync.setActiveOccurrenceIndex(0);
    focusPreviewPane();
  }

  useEffect(() => {
    if (!sync.activeGroupId) return;
    const listEl = listContainerRef.current;
    if (!listEl) return;

    const activeRow = listEl.querySelector<HTMLElement>(`#group-${sync.activeGroupId}`);
    if (!activeRow) return;

    const rowTop = activeRow.offsetTop;
    // TUNE THIS VALUE:
    // Positive number = moves the card DOWN (adds space above it).
    // Negative number = moves the card UP (hides it under top edge).
    // Start with 0. If it's too high, try 20, 40, etc.
    const manualOffset = 375;

    const desiredScrollTop = Math.max(0, rowTop - manualOffset);

    const delta = Math.abs(listEl.scrollTop - desiredScrollTop);
    if (delta > 25) {
      listEl.scrollTo({ top: desiredScrollTop, behavior: "auto" });
    }
  }, [sync.activeGroupId, sync.previewGroupId]);

  function cycleGroup(direction: 1 | -1) {
    if (navigatorGroups.length === 0) return;
    const ids = navigatorGroups.map((group) => group.group_id);
    const currentIndex = activeGroup ? ids.indexOf(activeGroup.group_id) : -1;
    const nextIndex = currentIndex < 0 ? 0 : (currentIndex + direction + ids.length) % ids.length;
    handleNavigatorSelect(ids[nextIndex]);
  }

  return (
    <main
      className={`mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 ${
        isReviewMode ? "pt-2 pb-4 sm:pt-3 sm:pb-5 lg:pt-3 lg:pb-6" : "py-8 lg:py-12"
      }`}
    >
      <header
        className={
          isReviewMode
            ? "mb-3 flex flex-wrap items-center gap-x-3 gap-y-1"
            : "mb-8 max-w-3xl"
        }
      >
        {isReviewMode ? (
          <>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-white"
              aria-label="Back to Hub"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Back</span>
            </Link>
            <span className="text-gray-600" aria-hidden="true">·</span>
            <h1 className="text-xl font-bold text-white sm:text-2xl">Resolution Cleaner</h1>
          </>
        ) : (
          <>
            <div className="mb-6">
              <Link
                href="/"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg px-2 text-sm text-gray-400 transition-colors hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to Hub
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Resolution Cleaner</h1>
            <p className="mt-1 text-sm text-gray-400">
              Upload a resolution to detect and replace deal-specific variables.
            </p>
          </>
        )}
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
        <div className="space-y-3 lg:space-y-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(420px,1fr)] lg:items-start xl:grid-cols-[minmax(0,1.65fr)_minmax(440px,1fr)]">
            <div
              ref={previewContainerRef}
              className="h-[70vh] lg:sticky lg:top-2 lg:h-[calc(100vh-88px)]"
            >
              <DocumentPreviewIframe
                html={upload.parseResult!.previewHtml}
                activeGroupId={activeGroup?.group_id ?? null}
                activeOccurrenceIndex={sync.activeOccurrenceIndex}
                onHighlightClick={sync.handleHighlightClick}
                replacements={sync.confirmedReplacements}
              />
            </div>

            {/* Right workspace viewport: fixed-height stack (controls + scrollable terms list). */}
            <div className="space-y-3 lg:sticky lg:top-1 lg:flex lg:h-[calc(100vh-88px)] lg:flex-col lg:space-y-3 lg:overflow-hidden">
              <Card className="space-y-1.5 p-2.5 sm:p-3 lg:shrink-0 lg:space-y-1.5">
                <div className="space-y-0.5 border-b border-gray-800 pb-1.5">
                  <p className="truncate text-xs font-semibold uppercase tracking-wide text-gray-300">
                    {upload.parseResult!.fileName}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Confirmed {groups.confirmedCount} · Remaining {unresolvedGroups.length}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-gray-400">Review Mode</span>
                  <div className="grid grid-cols-2 gap-1 rounded-lg bg-gray-900 p-1">
                    <button
                      type="button"
                      onClick={() => setViewMode("document")}
                      className={`min-h-[44px] rounded px-2.5 py-1.5 text-xs font-medium transition-colors lg:min-h-[36px] ${
                        viewMode === "document"
                          ? "bg-gray-700 text-white shadow-sm"
                          : "text-gray-400 hover:text-gray-300"
                      }`}
                    >
                      Document Order
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("grouped")}
                      className={`min-h-[44px] rounded px-2.5 py-1.5 text-xs font-medium transition-colors lg:min-h-[36px] ${
                        viewMode === "grouped"
                          ? "bg-gray-700 text-white shadow-sm"
                          : "text-gray-400 hover:text-gray-300"
                      }`}
                    >
                      Grouped
                    </button>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-1.5 text-center">
                  <div className="grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => cycleGroup(-1)}
                      disabled={navigatorGroups.length < 2}
                      aria-label="Previous field"
                      className="px-2"
                    >
                      {"<"}
                    </Button>
                    <p className="text-center text-xs text-gray-300">
                      {navigatorGroups.length === 0
                        ? "No active field"
                        : `${activeGroupPosition} of ${navigatorGroups.length}`}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => cycleGroup(1)}
                      disabled={navigatorGroups.length < 2}
                      aria-label="Next field"
                      className="px-2"
                    >
                      {">"}
                    </Button>
                  </div>
                  <p className="mt-1 text-[10px] uppercase tracking-wide text-gray-500">Current field</p>
                  <p className="mt-0.5 line-clamp-2 break-words text-sm font-semibold text-gray-100">
                    {activeGroup ? activeGroup.detected_value_raw : "Select a value from the list below"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    Mention {Math.min(sync.activeOccurrenceIndex + 1, Math.max(1, activeOccurrenceTotal))} of{" "}
                    {Math.max(1, activeOccurrenceTotal)}
                  </p>
                </div>

                <p className="text-[10px] text-gray-500">
                  Navigation order follows document position (top to bottom).
                </p>

                <div className="space-y-1.5">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleApplyAll}
                    disabled={groups.confirmedCount === 0 || replacement.isReplacing}
                    className="w-full"
                  >
                    {replacement.isReplacing ? "Applying…" : `Apply All Confirmed (${groups.confirmedCount})`}
                  </Button>
                  <p className="text-[11px] text-gray-500">
                    We only replace exact confirmed text and preserve literal values.
                  </p>
                </div>
              </Card>

              <div
                ref={listContainerRef}
                className="space-y-2 pb-3 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:scroll-pb-6 lg:scroll-pt-3 lg:pr-1"
              >
                <VariableGroupList
                  groups={groups.groups}
                  filter="all"
                  viewMode={viewMode}
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
                  onReplaceConfirm={handleReplaceConfirm}
                  onReplaceCancel={sync.handleClosePanel}
                  activeGroupId={sync.activeGroupId}
                />

                {replacement.error ? (
                  <Card className="border-red-800/50 bg-red-950/20">
                    <p className="text-sm text-red-300">{replacement.error}</p>
                  </Card>
                ) : null}
              </div>

              {feedback ? (
                <div className="fixed left-1/2 top-4 z-50 flex min-h-[44px] -translate-x-1/2 items-center gap-2 rounded-lg border border-green-800 bg-green-900/90 px-4 py-3 text-sm text-green-100 shadow-xl backdrop-blur-sm animate-in fade-in slide-in-from-top-2 md:left-auto md:right-6 md:top-6 md:translate-x-0">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  {feedback}
                </div>
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
