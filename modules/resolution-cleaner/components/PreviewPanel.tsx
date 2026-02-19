"use client";

import { Button } from "@/components/ui/Button";
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
  const total = group.occurrences.length;

  return (
    <>
      {/* ── Mobile: full-screen overlay ─────────────────────────── */}
      <div className="fixed inset-0 z-50 flex flex-col bg-gray-950 sm:hidden">
        <div className="flex items-start justify-between gap-2 border-b border-gray-800 p-4">
          <div>
            <p className="text-sm font-medium text-white">
              Preview: &ldquo;{group.detected_value_raw}&rdquo;
            </p>
            <p className="mt-0.5 text-xs text-gray-400">
              Occurrence {occurrenceIndex + 1} of {total}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <ContextBlock
            occurrence={occurrence}
            excluded={excluded}
          />
          <NavigationRow
            occurrenceIndex={occurrenceIndex}
            total={total}
            onPrev={onPrev}
            onNext={onNext}
          />
          <ExcludeToggle
            excluded={excluded}
            onToggle={() => onToggleExclude(occurrence.index)}
          />
        </div>
      </div>

      {/* ── Desktop: inline within the row card ─────────────────── */}
      <div className="hidden sm:block space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-gray-400">
            Occurrence {occurrenceIndex + 1} of {total}
          </p>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>

        <ContextBlock occurrence={occurrence} excluded={excluded} />

        <NavigationRow
          occurrenceIndex={occurrenceIndex}
          total={total}
          onPrev={onPrev}
          onNext={onNext}
        />

        <ExcludeToggle
          excluded={excluded}
          onToggle={() => onToggleExclude(occurrence.index)}
        />
      </div>
    </>
  );
}

/* ─── Sub-components ───────────────────────────────────────────── */

function ContextBlock({
  occurrence,
  excluded,
}: {
  occurrence: { context_before: string; match_text: string; context_after: string };
  excluded: boolean;
}) {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-950 p-3 text-xs leading-relaxed text-gray-300">
      <span>{occurrence.context_before}</span>
      {excluded ? (
        <span className="line-through text-gray-500">{occurrence.match_text}</span>
      ) : (
        <mark className="rounded bg-yellow-900/60 px-0.5 text-yellow-200 not-italic">
          {occurrence.match_text}
        </mark>
      )}
      <span>{occurrence.context_after}</span>
    </div>
  );
}

function NavigationRow({
  occurrenceIndex,
  total,
  onPrev,
  onNext,
}: {
  occurrenceIndex: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <Button
        variant="secondary"
        size="sm"
        onClick={onPrev}
        disabled={occurrenceIndex === 0}
        aria-label="Previous occurrence"
      >
        ← Prev
      </Button>
      <span className="flex-1 text-center text-xs text-gray-400">
        {occurrenceIndex + 1} / {total}
      </span>
      <Button
        variant="secondary"
        size="sm"
        onClick={onNext}
        disabled={occurrenceIndex === total - 1}
        aria-label="Next occurrence"
      >
        Next →
      </Button>
    </div>
  );
}

function ExcludeToggle({
  excluded,
  onToggle,
}: {
  excluded: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-300 select-none">
      <input
        type="checkbox"
        checked={excluded}
        onChange={onToggle}
        className="h-4 w-4 rounded border-gray-600 bg-gray-900 accent-white"
      />
      {excluded ? (
        <span className="text-gray-500">Excluded from replacement</span>
      ) : (
        "Exclude this occurrence"
      )}
    </label>
  );
}

