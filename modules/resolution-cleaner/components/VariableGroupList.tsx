"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { PreviewPanel } from "@/modules/resolution-cleaner/components/PreviewPanel";
import { ReplaceForm } from "@/modules/resolution-cleaner/components/ReplaceForm";
import { VariableGroupRow } from "@/modules/resolution-cleaner/components/VariableGroupRow";
import type { VariableGroupState, VariableType } from "@/modules/resolution-cleaner/types/resolutionData";

export type ReviewFilter = "all" | "needs_action" | "confirmed" | "ignored";

interface VariableGroupListProps {
  groups: VariableGroupState[];
  filter: ReviewFilter;
  collapsedByType: Partial<Record<VariableType, boolean>>;
  onToggleSection: (type: VariableType) => void;
  onPreview: (groupId: string) => void;
  onStartReplace: (groupId: string) => void;
  onIgnore: (groupId: string) => void;
  onUndo: (groupId: string) => void;
  // Preview state
  previewGroupId: string | null;
  previewOccurrenceIndex: number;
  onPreviewClose: () => void;
  onPreviewPrev: () => void;
  onPreviewNext: () => void;
  onPreviewToggleExclude: (groupId: string, occurrenceIndex: number) => void;
  // Replace state
  replaceGroupId: string | null;
  onReplaceConfirm: (groupId: string, value: string) => void;
  onReplaceCancel: () => void;
}

const ORDER: VariableType[] = [
  "date",
  "currency",
  "series",
  "borrower",
  "funding_lender",
  "project_name",
  "property_address",
  "bond_counsel",
  "unit_count",
  "issuer",
];

const LABELS: Record<VariableType, string> = {
  date: "Dates",
  currency: "Dollar Amounts",
  series: "Series",
  borrower: "Borrower",
  funding_lender: "Funding Lender",
  project_name: "Project Name",
  property_address: "Property Address",
  bond_counsel: "Bond Counsel",
  unit_count: "Unit Count",
  issuer: "Anchors",
};

export function VariableGroupList({
  groups,
  filter,
  collapsedByType,
  onToggleSection,
  onPreview,
  onStartReplace,
  onIgnore,
  onUndo,
  previewGroupId,
  previewOccurrenceIndex,
  onPreviewClose,
  onPreviewPrev,
  onPreviewNext,
  onPreviewToggleExclude,
  replaceGroupId,
  onReplaceConfirm,
  onReplaceCancel,
}: VariableGroupListProps) {
  const filteredGroups = groups.filter((group) => {
    if (filter === "all") return true;
    if (filter === "needs_action") return !group.is_locked && group.action !== "done" && group.action !== "ignored";
    if (filter === "confirmed") return group.action === "done";
    if (filter === "ignored") return group.action === "ignored";
    return true;
  });

  const groupSortScore = (group: VariableGroupState): number => {
    if (group.is_locked) return 3;
    if (group.action === "done") return 2;
    if (group.action === "ignored") return 4;
    return 1;
  };

  return (
    <div className="space-y-7">
      {ORDER.map((type) => {
        const sectionGroups = filteredGroups
          .filter((g) => g.type === type)
          .sort(
            (a, b) =>
              groupSortScore(a) - groupSortScore(b) ||
              b.occurrence_count - a.occurrence_count ||
              a.detected_value_raw.localeCompare(b.detected_value_raw),
          );

        if (sectionGroups.length === 0) return null;
        const collapsed = collapsedByType[type] ?? false;

        return (
          <section key={type} className="space-y-3">
            <button
              type="button"
              onClick={() => onToggleSection(type)}
              className="flex w-full items-center justify-between rounded-md px-1 py-1 text-left transition-colors hover:bg-gray-900/50"
              aria-expanded={!collapsed}
            >
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                {LABELS[type]} ({sectionGroups.length})
              </h2>
              {collapsed ? (
                <ChevronRight className="h-4 w-4 text-gray-500" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" aria-hidden="true" />
              )}
            </button>

            {!collapsed ? <div className="space-y-3">
              {sectionGroups.map((group) => {
                const isPreviewing = group.group_id === previewGroupId;
                const isReplacing = group.group_id === replaceGroupId;

                const panelSlot = isPreviewing ? (
                  <PreviewPanel
                    group={group}
                    occurrenceIndex={previewOccurrenceIndex}
                    onClose={onPreviewClose}
                    onPrev={onPreviewPrev}
                    onNext={onPreviewNext}
                    onToggleExclude={(idx) => onPreviewToggleExclude(group.group_id, idx)}
                  />
                ) : isReplacing ? (
                  <ReplaceForm
                    group={group}
                    onCancel={onReplaceCancel}
                    onConfirm={(value) => onReplaceConfirm(group.group_id, value)}
                  />
                ) : undefined;

                return (
                  <VariableGroupRow
                    key={group.group_id}
                    group={group}
                    onPreview={() => onPreview(group.group_id)}
                    onStartReplace={() => onStartReplace(group.group_id)}
                    onIgnore={() => onIgnore(group.group_id)}
                    onUndo={() => onUndo(group.group_id)}
                    panelSlot={panelSlot}
                  />
                );
              })}
            </div> : null}
          </section>
        );
      })}
    </div>
  );
}
