import { Card } from "@/components/ui/Card";
import type { ChangeLogEntry } from "@/modules/resolution-cleaner/types/resolutionData";

interface ChangeLogProps {
  entries: ChangeLogEntry[];
}

export function ChangeLog({ entries }: ChangeLogProps) {
  if (entries.length === 0) {
    return null;
  }

  const timestamp = entries[0]?.timestamp ?? new Date().toISOString();

  return (
    <Card className="space-y-3 border-slate-200 bg-white">
      <h2 className="text-sm font-semibold text-slate-900">Change Log</h2>
      <ul className="space-y-2">
        {entries.map((entry) => (
          <li key={`${entry.original_value}-${entry.new_value}-${entry.term_key ?? "null"}`}>
            <p className="text-sm text-slate-700">
              {entry.original_value} → {entry.new_value}
              <span className="ml-2 text-xs text-slate-500">({entry.replacement_count})</span>
            </p>
          </li>
        ))}
      </ul>
      <p className="text-xs text-slate-500">Generated: {new Date(timestamp).toLocaleString()}</p>
    </Card>
  );
}

