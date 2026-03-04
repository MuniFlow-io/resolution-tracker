# Resolution Cleaner UI Optimization Review & Handoff

**Date**: March 4, 2026
**Topic**: UI Redundancy Analysis & Optimization Strategy (v1.3 Candidate)

## 1. Executive Summary

This document reviews the current state of the Resolution Cleaner UI following the implementation of "Auto-Advance" and "Document-Order Review Mode". While functional, the current interface suffers from **redundancy** and **cognitive overload** due to two competing control mechanisms: the "Master Control Panel" (top sidebar) and the "Variable Widgets" (the list items).

The proposed direction is to **minimalize the top bar** and shift the primary interaction model to the list items themselves, creating a more natural, document-flow-based review experience.

---

## 2. Current State Analysis

### The Redundancy Problem
Currently, users have two ways to do the same thing, creating visual noise:

1.  **Top Control Panel**:
    *   Shows "Active Review Value" dropdown.
    *   Shows navigation buttons ("Next Value", "Previous Value").
    *   Shows action buttons ("Replace Active").
    *   Displays detailed stats (Detected, Confirmed, Ignored).
2.  **List Items (Widgets)**:
    *   Show the same values.
    *   Have their own "Replace" / "Preview" buttons.
    *   Expand to show inline forms.

**Issue**: The Top Control Panel takes up significant vertical space (approx. 300px+) and forces the user's eye to jump between the "controller" at the top and the "content" in the list below.

### The "Jumpiness" Issue
Switching between **Grouped Mode** and **Document Order Mode** causes a jarring layout shift because:
1.  The entire list is re-rendered in a new order.
2.  The scroll position is often lost or reset.
3.  The "Active Item" might jump from the top of the viewport to the bottom, disorienting the user.

---

## 3. Proposed Design (v1.3)

### A. Minimal Top Bar
We should strip the top sidebar panel down to its bare essentials.

**Keep:**
*   **Document Title**: Context is always needed.
*   **View Mode Toggle**: Essential for the new workflow.
*   **Global Actions**: "Apply All" and "Download" (maybe move to a sticky footer or keep compact at top).
*   **Simple Stepper**: A very compact "Previous / Next Issue" arrow set, similar to "Find in Page" controls ( < 1 of 14 > ).

**Remove/Relocate:**
*   **Detailed Stats**: Move to a collapsed state or bottom footer.
*   **"Active Review Value" Dropdown**: Redundant. The list *is* the review.
*   **"Replace Active" Button**: The action should happen on the widget itself.

### B. Enhanced Variable Widgets
The list item (widget) becomes the primary interface.

*   **Focus State**: When a user navigates to a field (via Auto-Advance or clicking), that specific widget should visually expand or highlight significantly to indicate it is the "Active" one.
*   **Inline Replacement**: The replacement form stays inside the widget (as it is now), but the interaction is smoother.

### C. Advanced Occurrence Handling
**Current Limitation**: The `ReplaceForm` replaces *all* occurrences of a string within a group.
**User Request**: "If it has three occurrences... replace each one or replace all."

**Proposed Feature: Split Group / Individual Replace**
*   When a group has >1 occurrence, the widget should offer:
    1.  **Replace All** (Default): Updates all instances.
    2.  **Review Individual**: Expands to show each specific occurrence in the document context.
    3.  **Split**: Allows the user to treat one occurrence differently (e.g., replace the first "$100" with "$150" and the second with "$200").

---

## 4. Technical Implementation Recommendations

### 1. Smoothing the "Jump"
To fix the jarring transition between Document Order and Grouped modes:
*   **Preserve Active Item Scroll**: When switching modes, calculate the new position of the `activeGroupId` and immediately scroll it to the same relative screen position.
*   **List Animation**: Use a library like `framer-motion` (or simple CSS transitions) to animate the list reordering. This provides object permanence—users see the items shuffle rather than disappear and reappear.

### 2. Refactoring `page.tsx`
*   Extract the "Master Control Panel" into a smaller, purely navigational component.
*   Move state logic for "Active Item" deeper into a context or hook that both the List and the Nav Bar subscribe to, ensuring they are always in sync without prop drilling.

### 3. Split Group Logic
*   **Backend/Hook Update**: The `useVariableGroups` hook needs a new action: `splitGroup(groupId, occurrenceIndex)`.
*   This action would create a *new* `VariableGroup` for just that specific occurrence, removing it from the original group.
*   This allows the user to treat it as a completely separate entity.

---

## 5. Next Steps
1.  **Approval**: Confirm this minimal direction with stakeholders.
2.  **Mockup**: Create a quick wireframe of the "Minimal Top Bar".
3.  **Refactor**: Execute the reduction of the Top Bar and enhancement of the Widget list.
