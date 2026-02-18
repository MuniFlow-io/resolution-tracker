"use client";

import { VariableGroupRow } from "@/modules/resolution-cleaner/components/VariableGroupRow";
import type { VariableGroupState, VariableType } from "@/modules/resolution-cleaner/types/resolutionData";

interface VariableGroupListProps {
  groups: VariableGroupState[];
  onPreview: (groupId: string) => void;
  onStartReplace: (groupId: string) => void;
  onIgnore: (groupId: string) => void;
  onUndo: (groupId: string) => void;
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
}: VariableGroupListProps) {
  return (
    <div className="space-y-7">
      {ORDER.map((type) => {
        const sectionGroups = groups.filter((group) => group.type === type);
        if (sectionGroups.length === 0) {
          return null;
        }

        return (
          <section key={type} className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
              {LABELS[type]} ({sectionGroups.length})
            </h2>
            <div className="space-y-3">
              {sectionGroups.map((group) => (
                <VariableGroupRow
                  key={group.group_id}
                  group={group}
                  onPreview={() => onPreview(group.group_id)}
                  onStartReplace={() => onStartReplace(group.group_id)}
                  onIgnore={() => onIgnore(group.group_id)}
                  onUndo={() => onUndo(group.group_id)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

