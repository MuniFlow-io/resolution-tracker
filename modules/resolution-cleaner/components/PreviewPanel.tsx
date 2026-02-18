"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { VariableGroupState } from "@/modules/resolution-cleaner/types/resolutionData";

interface PreviewPanelProps {
  group: VariableGroupState;
  occurrenceIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleExclude: (occurrenceIndex: number) => void;
}

export function PreviewPanel({
  group,
  occurrenceIndex,
  onClose,
  onPrev,
  onNext,
  onToggleExclude,
}: PreviewPanelProps) {
  const occurrence = group.occurrences[occurrenceIndex];
  const state = group.occurrenceStates.find((item) => item.index === occurrence.index);
  const excluded = state?.status === "excluded";

  return (
    // Mobile: fixed full-screen overlay. sm+: inline card.
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-950 sm:relative sm:inset-auto sm:z-auto sm:flex-none sm:bg-transparent">
    <Card className="flex h-full flex-col space-y-4 overflow-y-auto rounded-none border-0 bg-gray-950 p-4 sm:rounded-xl sm:border sm:border-gray-700 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-white">Preview: “{group.detected_value_raw}”</p>
          <p className="mt-1 text-xs text-gray-400">
            Occurrence {occurrenceIndex + 1} of {group.occurrences.length}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="rounded-lg border border-gray-800 bg-gray-900 p-3 text-xs leading-relaxed text-gray-300">
        <span>{occurrence.context_before}</span>
        <mark className="rounded bg-yellow-900/60 px-1 text-yellow-200">
          {occurrence.match_text}
        </mark>
        <span>{occurrence.context_after}</span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button variant="secondary" size="sm" onClick={onPrev}>
          Prev
        </Button>
        <span className="text-xs text-gray-400">
          {occurrenceIndex + 1} / {group.occurrences.length}
        </span>
        <Button variant="secondary" size="sm" onClick={onNext}>
          Next
        </Button>
      </div>

      <label className="flex items-center gap-2 text-xs text-gray-300">
        <input
          type="checkbox"
          checked={excluded}
          onChange={() => onToggleExclude(occurrence.index)}
          className="h-4 w-4 rounded border-gray-600 bg-gray-900"
        />
        Exclude this occurrence
      </label>
    </Card>
    </div>
  );
}

