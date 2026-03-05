"use client";

import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { VariableGroupState } from "@/modules/resolution-cleaner/types/resolutionData";

interface VariableGroupRowProps {
  group: VariableGroupState;
  onPreview: () => void;
  onStartReplace: () => void;
  onIgnore: () => void;
  onUndo: () => void;
  /** Rendered inline below the action buttons — PreviewPanel or ReplaceForm. */
  panelSlot?: ReactNode;
  /** Optional label to display the category (e.g. "Dates") above the value. */
  categoryLabel?: string;
  /** When true, shows a light yellow glow to match the document highlight. */
  isActive?: boolean;
}

function rowClass(group: VariableGroupState): string {
  if (group.is_locked) return "border-amber-200 bg-amber-50";
  if (group.action === "done") return "border-emerald-200 bg-emerald-50";
  if (group.action === "ignored") return "border-slate-200 bg-slate-50 opacity-70";
  return "border-slate-200 bg-white";
}

export function VariableGroupRow({
  group,
  onPreview,
  onStartReplace,
  onIgnore,
  onUndo,
  panelSlot,
  categoryLabel,
  isActive,
}: VariableGroupRowProps) {
  const activeCount = group.occurrenceStates.filter((o) => o.status !== "excluded").length;

  return (
    <Card
      id={`group-${group.group_id}`}
      className={cn(
        "p-3 transition-shadow",
        rowClass(group),
        isActive && "border-yellow-400 ring-1 ring-inset ring-yellow-300 bg-yellow-50",
      )}
    >
      {/* ── Header row ─────────────────────────────────── */}
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0">
          {categoryLabel ? (
            <span className="mb-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-600">
              {categoryLabel}
            </span>
          ) : null}
          <p
            className={cn(
              "break-words text-sm font-medium",
              group.action === "ignored" ? "text-slate-500 line-through" : "text-slate-900",
            )}
          >
            {group.detected_value_raw}
          </p>
          {group.action === "done" && group.replacement_value ? (
            <p className="mt-0.5 break-words text-xs text-emerald-700">
              → {group.replacement_value}
            </p>
          ) : null}
        </div>
        <Badge variant={group.is_locked ? "locked" : "neutral"} className="shrink-0">
          {activeCount}×
        </Badge>
      </div>

      {/* ── Action buttons ─────────────────────────────── */}
      {group.is_locked ? (
        <div className="mt-2 flex items-center gap-2 text-xs text-amber-700">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          Locked anchor — display only
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          {group.action === "ignored" ? (
            <Button variant="ghost" size="sm" onClick={onUndo}>
              Undo Ignore
            </Button>
          ) : (
            <>
              <Button variant="secondary" size="sm" onClick={onPreview}
                aria-label={`Preview occurrences of ${group.detected_value_raw}`}>
                Preview
              </Button>
              {group.action === "done" ? (
                <Button variant="ghost" size="sm" onClick={onUndo}>
                  Undo
                </Button>
              ) : (
                <Button variant="secondary" size="sm" onClick={onStartReplace}
                  aria-label={`Replace ${group.detected_value_raw}`}>
                  Replace
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onIgnore}
                className="text-slate-500 hover:text-slate-800"
              >
                Ignore
              </Button>
            </>
          )}
        </div>
      )}

      {/* ── Inline panel (Preview or Replace) ──────────── */}
      {panelSlot ? (
        <div className="-mx-3 mt-2 border-t border-slate-200 px-3 pt-3">
          {panelSlot}
        </div>
      ) : null}
    </Card>
  );
}
