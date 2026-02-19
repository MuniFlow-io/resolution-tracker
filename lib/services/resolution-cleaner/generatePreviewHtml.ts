import mammoth from "mammoth";
import type { VariableGroup } from "@/modules/resolution-cleaner/types/resolutionData";

/**
 * Converts a .docx buffer into HTML for the preview pane, injecting <mark> tags
 * around all detected variables so the frontend can hook into them for interaction.
 */
export async function generatePreviewHtml(
  buffer: Buffer,
  groups: VariableGroup[],
): Promise<string> {
  // 1. Convert .docx to raw HTML using mammoth
  const result = await mammoth.convertToHtml({ buffer });
  let html = result.value;

  // We need to find and highlight the exact text occurrences in the HTML output.
  // Mammoth's HTML does not match the `flatText` character offsets directly because
  // mammoth strips some whitespace, adds <p> tags, etc.
  // We will do text-based replacement in the HTML, but carefully so we don't break HTML tags.
  
  // First, gather all distinct strings we need to highlight, sorted by length descending
  // so we don't accidentally replace a substring of a longer match first.
  const toHighlight = Array.from(new Set(groups.map((g) => g.detected_value_raw))).sort(
    (a, b) => b.length - a.length,
  );

  for (const rawText of toHighlight) {
    // Find the group that owns this text to get its ID and type
    const group = groups.find((g) => g.detected_value_raw === rawText);
    if (!group) continue;

    // Escape regex characters in the raw text
    const escapedText = rawText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    
    // Create a regex that matches the text ONLY if it's outside of HTML tags.
    // (?![^<]*>) ensures we aren't currently inside an opening or closing HTML tag
    // like <p class="September 1"> (unlikely, but safe).
    // Note: mammoth output is simple and clean so this works well.
    const safeRegex = new RegExp(`(${escapedText})(?![^<]*>)`, "g");

    // We use a custom attribute data-group-id to link the mark to the VariableGroup
    const replacement = `<mark data-group-id="${group.group_id}" data-type="${group.type}">${rawText}</mark>`;
    html = html.replace(safeRegex, replacement);
  }

  // Inject a small amount of CSS to handle our mark styling
  const style = `
    <style>
      body {
        font-family: system-ui, -apple-system, sans-serif;
        line-height: 1.5;
        padding: 1rem;
        color: #1f2937;
        background: #ffffff;
      }
      p { margin-top: 0; margin-bottom: 1rem; }
      
      /* Base mark style (pending) */
      mark {
        background-color: #fef08a; /* yellow-200 */
        color: #854d0e; /* yellow-800 */
        padding: 0 2px;
        border-radius: 2px;
        cursor: pointer;
        transition: all 0.2s ease;
        border: 1px solid #eab308; /* yellow-500 */
      }
      
      mark:hover {
        background-color: #fde047; /* yellow-300 */
      }

      /* Locked (Issuer) */
      mark[data-type="issuer"] {
        background-color: #ffedd5; /* amber-200 */
        color: #9a3412; /* amber-800 */
        border-color: #f59e0b; /* amber-500 */
        cursor: default;
      }

      /* Confirmed (handled dynamically by frontend script injected later, but we provide the class) */
      mark.confirmed {
        background-color: #bbf7d0 !important; /* green-200 */
        color: #166534 !important; /* green-800 */
        border-color: #22c55e !important; /* green-500 */
      }

      /* Active / Focused */
      mark.active {
        box-shadow: 0 0 0 4px rgba(234, 179, 8, 0.3);
      }
    </style>
  `;

  return style + html;
}
