"use client";

import { PreviewPanel } from "@/modules/resolution-cleaner/components/PreviewPanel";
import { ReplaceForm } from "@/modules/resolution-cleaner/components/ReplaceForm";
import { VariableGroupRow } from "@/modules/resolution-cleaner/components/VariableGroupRow";
import type { VariableGroupState, VariableType } from "@/modules/resolution-cleaner/types/resolutionData";

interface VariableGroupListProps {
  groups: VariableGroupState[];
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
  bond_counsel: "Bond Counsel",
  unit_count: "Unit Count",
  issuer: "Anchors",
};

export function VariableGroupList({
  groups,
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
  return (
    <div className="space-y-7">
      {ORDER.map((type) => {
        const sectionGroups = groups.filter((g) => g.type === type);
        if (sectionGroups.length === 0) return null;

        return (
          <section key={type} className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
              {LABELS[type]} ({sectionGroups.length})
            </h2>
            <div className="space-y-3">
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
            </div>
          </section>
        );
      })}
    </div>
  );
}
