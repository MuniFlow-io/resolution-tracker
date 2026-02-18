"use client";

import { useMemo, useState } from "react";
import type {
  ConfirmedReplacement,
  VariableGroup,
  VariableGroupState,
} from "@/modules/resolution-cleaner/types/resolutionData";

function toState(groups: VariableGroup[]): VariableGroupState[] {
  return groups.map((group) => ({
    ...group,
    action: "idle",
    occurrenceStates: group.occurrences.map((o) => ({
      index: o.index,
      status: "pending",
    })),
    replacement_value: null,
  }));
}

export interface UseVariableGroupsResult {
  groups: VariableGroupState[];
  selectedGroupId: string | null;
  selectedOccurrenceIndex: number;
  setGroupsFromParse: (groups: VariableGroup[]) => void;
  setSelectedGroupId: (id: string | null) => void;
  setSelectedOccurrenceIndex: (index: number) => void;
  setReplacementValue: (groupId: string, value: string) => void;
  confirmGroupReplacement: (groupId: string) => void;
  ignoreGroup: (groupId: string) => void;
  undoGroup: (groupId: string) => void;
  toggleOccurrenceExcluded: (groupId: string, occurrenceIndex: number) => void;
  buildConfirmedReplacements: () => ConfirmedReplacement[];
  confirmedCount: number;
}

export function useVariableGroups(): UseVariableGroupsResult {
  const [groups, setGroups] = useState<VariableGroupState[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedOccurrenceIndex, setSelectedOccurrenceIndex] = useState(0);

  function setGroupsFromParse(inputGroups: VariableGroup[]) {
    setGroups(toState(inputGroups));
    setSelectedGroupId(null);
    setSelectedOccurrenceIndex(0);
  }

  function setReplacementValue(groupId: string, value: string) {
    setGroups((prev) =>
      prev.map((group) =>
        group.group_id === groupId
          ? { ...group, replacement_value: value, action: "replacing" }
          : group,
      ),
    );
  }

  function confirmGroupReplacement(groupId: string) {
    setGroups((prev) =>
      prev.map((group) => {
        if (group.group_id !== groupId) {
          return group;
        }
        if (!group.replacement_value?.trim()) {
          return group;
        }
        return {
          ...group,
          action: "done",
          occurrenceStates: group.occurrenceStates.map((o) =>
            o.status === "excluded" ? o : { ...o, status: "confirmed" },
          ),
        };
      }),
    );
  }

  function ignoreGroup(groupId: string) {
    setGroups((prev) =>
      prev.map((group) =>
        group.group_id === groupId
          ? {
              ...group,
              action: "ignored",
              replacement_value: null,
              occurrenceStates: group.occurrenceStates.map((o) => ({
                ...o,
                status: "pending",
              })),
            }
          : group,
      ),
    );
  }

  function undoGroup(groupId: string) {
    setGroups((prev) =>
      prev.map((group) =>
        group.group_id === groupId
          ? {
              ...group,
              action: "idle",
              replacement_value: null,
              occurrenceStates: group.occurrenceStates.map((o) => ({
                ...o,
                status: "pending",
              })),
            }
          : group,
      ),
    );
  }

  function toggleOccurrenceExcluded(groupId: string, occurrenceIndex: number) {
    setGroups((prev) =>
      prev.map((group) => {
        if (group.group_id !== groupId) return group;
        return {
          ...group,
          occurrenceStates: group.occurrenceStates.map((o) =>
            o.index === occurrenceIndex
              ? { ...o, status: o.status === "excluded" ? "pending" : "excluded" }
              : o,
          ),
        };
      }),
    );
  }

  function buildConfirmedReplacements(): ConfirmedReplacement[] {
    return groups
      .filter((group) => group.action === "done" && group.replacement_value?.trim())
      .map((group) => ({
        group_id: group.group_id,
        original_value: group.detected_value_raw,
        new_value: group.replacement_value!.trim(),
        confirmed_occurrence_offsets: group.occurrences
          .filter((occ) => {
            const state = group.occurrenceStates.find((item) => item.index === occ.index);
            return state?.status !== "excluded";
          })
          .map((occ) => ({ start: occ.start_offset, end: occ.end_offset })),
        term_key: group.term_key,
      }))
      .filter((entry) => entry.confirmed_occurrence_offsets.length > 0);
  }

  const confirmedCount = useMemo(
    () => groups.filter((group) => group.action === "done").length,
    [groups],
  );

  return {
    groups,
    selectedGroupId,
    selectedOccurrenceIndex,
    setGroupsFromParse,
    setSelectedGroupId,
    setSelectedOccurrenceIndex,
    setReplacementValue,
    confirmGroupReplacement,
    ignoreGroup,
    undoGroup,
    toggleOccurrenceExcluded,
    buildConfirmedReplacements,
    confirmedCount,
  };
}

