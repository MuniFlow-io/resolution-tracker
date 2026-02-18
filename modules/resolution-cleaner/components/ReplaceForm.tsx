"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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
    <Card className="space-y-4 border-gray-700 bg-gray-950 p-4">
      <div>
        <p className="text-sm font-medium text-white">Replace: “{group.detected_value_raw}”</p>
        <p className="mt-1 text-xs text-gray-400">
          This will replace {activeCount} {activeCount === 1 ? "occurrence" : "occurrences"}.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor={`replacement-${group.group_id}`} className="text-xs text-gray-400">
          Replace with
        </label>
        <Input
          id={`replacement-${group.group_id}`}
          value={value}
          hasError={!!error}
          onChange={(event) => setValue(event.target.value)}
          onBlur={() => setSubmitted(true)}
          placeholder="Enter the new value"
        />
        {error ? (
          <p role="alert" className="text-xs text-red-400">
            {error}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
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
    </Card>
  );
}

