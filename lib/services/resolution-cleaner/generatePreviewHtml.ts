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
    const replacement = `<mark data-group-id="${group.group_id}" data-type="${group.type}" data-original="${escapedText}">${rawText}</mark>`;
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
        background-color: transparent;
        color: #1f2937; /* inherit text color */
        padding: 0 2px;
        border-radius: 2px;
        cursor: pointer;
        transition: all 0.2s ease;
        border: 1px dashed #d1d5db; /* gray-300 */
      }
      
      mark:hover {
        background-color: #f3f4f6; /* gray-100 */
        border-style: solid;
      }

      /* Locked (Issuer) */
      mark[data-type="issuer"] {
        border-color: #fbd38d; /* orange-200 */
        background-color: #fffaf0; /* orange-50 */
        cursor: default;
      }

      /* Confirmed */
      mark.confirmed {
        background-color: #dcfce7 !important; /* green-100 */
        color: #166534 !important; /* green-800 */
        border: 1px solid #4ade80 !important; /* green-400 */
      }

      /* Active / Focused (The one currently being previewed or replaced) */
      mark.active {
        background-color: #fef08a !important; /* yellow-200 */
        color: #854d0e !important; /* yellow-800 */
        border: 2px solid #eab308 !important; /* yellow-500 */
        box-shadow: 0 0 0 4px rgba(234, 179, 8, 0.3);
        font-weight: 600;
        z-index: 10;
        position: relative;
      }
    </style>
  `;

  return style + html;
}
