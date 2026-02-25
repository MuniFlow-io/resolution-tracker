import { useState, useCallback, useMemo } from "react";
import type { VariableGroupState } from "@/modules/resolution-cleaner/types/resolutionData";

interface UseBiDirectionalSyncProps {
  groups: VariableGroupState[];
  onIgnore: (groupId: string) => void;
  onUndo: (groupId: string) => void;
  setReplacementValue: (groupId: string, value: string) => void;
  confirmReplacement: (groupId: string) => void;
}

export function useBiDirectionalSync({
  groups,
  onIgnore,
  onUndo,
  setReplacementValue,
  confirmReplacement,
}: UseBiDirectionalSyncProps) {
  // Mobile uses these exact state vars for the full-screen overlay vs inline form.
  // Desktop uses them to know which accordion is open and which highlight to pulse.
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [activeOccurrenceIndex, setActiveOccurrenceIndex] = useState(0);
  
  // Track if the current active state was triggered by a "Preview" click
  // or a "Replace" click so the correct inline panel opens in the list.
  const [activePanelType, setActivePanelType] = useState<"preview" | "replace" | null>(null);

  const handleStartPreview = useCallback((groupId: string) => {
    setActiveGroupId(groupId);
    setActiveOccurrenceIndex(0);
    setActivePanelType("preview");
  }, []);

  const handleStartReplace = useCallback((groupId: string) => {
    setActiveGroupId(groupId);
    // When opening replace, we still want the preview iframe to scroll
    // to the first occurrence to show context behind the form.
    setActiveOccurrenceIndex(0);
    setActivePanelType("replace");
  }, []);

  const handleClosePanel = useCallback(() => {
    // Keep the active group/occurrence focused in the document preview.
    // Closing a panel should only close the UI panel, not reset navigation.
    setActivePanelType(null);
  }, []);

  // When a user clicks a yellow highlight inside the iframe,
  // we automatically open the Replace form for that group.
  const handleHighlightClick = useCallback((groupId: string) => {
    handleStartReplace(groupId);
  }, [handleStartReplace]);

  // Compute a map of confirmed replacements to pass to the iframe
  // so it can live-update the text content of the <mark> tags.
  const confirmedReplacements = useMemo(() => {
    const map: Record<string, string> = {};
    for (const group of groups) {
      if (group.action === "done" && group.replacement_value) {
        map[group.group_id] = group.replacement_value;
      }
    }
    return map;
  }, [groups]);

  // Derived state to pass to the VariableGroupList
  const previewGroupId = activePanelType === "preview" ? activeGroupId : null;
  const replaceGroupId = activePanelType === "replace" ? activeGroupId : null;

  return {
    activeGroupId,
    activeOccurrenceIndex,
    setActiveOccurrenceIndex,
    handleStartPreview,
    handleStartReplace,
    handleClosePanel,
    handleHighlightClick,
    confirmedReplacements,
    previewGroupId,
    replaceGroupId,
  };
}
