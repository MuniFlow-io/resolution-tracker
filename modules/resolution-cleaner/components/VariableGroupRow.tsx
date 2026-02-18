"use client";

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
}

function rowClass(group: VariableGroupState): string {
  if (group.is_locked) return "border-amber-800/40 bg-amber-950/10";
  if (group.action === "done") return "border-green-800/50 bg-green-950/10";
  if (group.action === "ignored") return "border-gray-800 bg-gray-900/40 opacity-70";
  return "border-gray-800 bg-gray-900/80";
}

export function VariableGroupRow({
  group,
  onPreview,
  onStartReplace,
  onIgnore,
  onUndo,
}: VariableGroupRowProps) {
  const activeCount = group.occurrenceStates.filter((o) => o.status !== "excluded").length;

  return (
    <Card className={cn("space-y-3 p-4", rowClass(group))}>
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={cn(
              "break-words text-sm font-medium",
              group.action === "ignored" ? "text-gray-500 line-through" : "text-white",
            )}
          >
            {group.detected_value_raw}
          </p>
          {group.action === "done" && group.replacement_value ? (
            <p className="mt-1 break-words text-xs text-green-300">
              → {group.replacement_value}
            </p>
          ) : null}
        </div>
        <Badge variant={group.is_locked ? "locked" : "neutral"} className="shrink-0">
          {activeCount}×
        </Badge>
      </div>

      {group.is_locked ? (
        <div className="flex items-center gap-2 text-xs text-amber-300">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          Locked anchor — display only
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="secondary" size="sm" onClick={onPreview}>
            Preview
          </Button>
          {group.action === "done" ? (
            <Button variant="ghost" size="sm" onClick={onUndo}>
              Undo
            </Button>
          ) : (
            <Button variant="secondary" size="sm" onClick={onStartReplace}>
              Replace
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onIgnore}
            className="text-gray-400 hover:text-white"
          >
            Ignore
          </Button>
        </div>
      )}
    </Card>
  );
}

