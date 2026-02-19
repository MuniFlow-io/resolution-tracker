"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { VariableGroupState } from "@/modules/resolution-cleaner/types/resolutionData";

interface ReplaceFormProps {
  group: VariableGroupState;
  onCancel: () => void;
  onConfirm: (value: string) => void;
}

export function ReplaceForm({ group, onCancel, onConfirm }: ReplaceFormProps) {
  const [value, setValue] = useState(group.replacement_value ?? "");
  const [submitted, setSubmitted] = useState(false);

  const activeCount = useMemo(
    () => group.occurrenceStates.filter((item) => item.status !== "excluded").length,
    [group.occurrenceStates],
  );

  const error = submitted && !value.trim() ? "Replacement value is required" : null;

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400">
        Will replace{" "}
        <span className="font-medium text-white">
          {activeCount} {activeCount === 1 ? "occurrence" : "occurrences"}
        </span>
      </p>

      <div className="space-y-1.5">
        <label
          htmlFor={`replacement-${group.group_id}`}
          className="text-xs text-gray-400"
        >
          Replace with
        </label>
        <Input
          id={`replacement-${group.group_id}`}
          value={value}
          hasError={!!error}
          autoFocus
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => setSubmitted(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setSubmitted(true);
              if (value.trim()) onConfirm(value.trim());
            }
            if (e.key === "Escape") onCancel();
          }}
          placeholder="Enter the new value"
        />
        {error ? (
          <p role="alert" className="text-xs text-red-400">
            {error}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setSubmitted(true);
            if (!value.trim()) return;
            onConfirm(value.trim());
          }}
        >
          Confirm Replacement
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
