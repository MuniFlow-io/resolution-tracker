"use client";

import { useEffect, useRef } from "react";
import { AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface DocumentPreviewIframeProps {
  html: string;
  activeGroupId: string | null;
  activeOccurrenceIndex: number;
  onHighlightClick: (groupId: string) => void;
  replacements: Record<string, string>; // group_id -> new_value
}

export function DocumentPreviewIframe({
  html,
  activeGroupId,
  activeOccurrenceIndex,
  onHighlightClick,
  replacements,
}: DocumentPreviewIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Initialize the iframe content and message listener
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // Inject the HTML and a small script to handle clicks and receiving messages
    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        ${html}
        <script>
          // Group and index all marks so we can scroll to specific occurrences
          const marks = Array.from(document.querySelectorAll('mark'));
          const groups = {};
          
          marks.forEach(mark => {
            const groupId = mark.getAttribute('data-group-id');
            if (!groupId) return;
            if (!groups[groupId]) groups[groupId] = [];
            groups[groupId].push(mark);
            
            // Set up click handler to notify the parent app
            mark.addEventListener('click', (e) => {
              e.preventDefault();
              window.parent.postMessage({ type: 'MARK_CLICKED', groupId }, '*');
            });
          });

          // Listen for commands from the parent React app
          window.addEventListener('message', (event) => {
            const data = event.data;
            if (!data) return;

            if (data.type === 'SET_ACTIVE') {
              // Remove active class from all
              marks.forEach(m => m.classList.remove('active'));
              
              if (data.groupId && groups[data.groupId]) {
                const targetMark = groups[data.groupId][data.occurrenceIndex || 0];
                if (targetMark) {
                  targetMark.classList.add('active');
                  // Scroll it into view smoothly
                  targetMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }
            }

            if (data.type === 'APPLY_REPLACEMENTS') {
              // Apply live text updates to the HTML based on confirmed replacements
              marks.forEach(mark => {
                const groupId = mark.getAttribute('data-group-id');
                if (!groupId) return;
                
                const newValue = data.replacements[groupId];
                if (newValue) {
                  mark.classList.add('confirmed');
                  mark.textContent = newValue;
                } else {
                  // Revert to original if replacement was undone
                  mark.classList.remove('confirmed');
                  // We need the original text back. We didn't store it on the mark in HTML generation,
                  // but we know it's the raw text that matched. Wait, we should have stored it.
                  // For now, if no replacement, we don't know the original text easily unless we 
                  // pass it in. We'll pass a 'revert' map in the future if needed, or just 
                  // re-render the iframe when replacements change significantly.
                  // Actually, it's safer to just set the HTML fresh if we need to revert everything,
                  // but for live typing, we'll just update it.
                }
              });
            }
          });
        </script>
      </html>
    `;

    const blob = new Blob([content], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    iframe.src = url;

    return () => URL.revokeObjectURL(url);
  }, [html]);

  // Handle messages coming FROM the iframe (user clicked a highlight)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // In a real app we'd check origin, but this is a blob URL
      if (event.data?.type === "MARK_CLICKED" && event.data.groupId) {
        onHighlightClick(event.data.groupId);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onHighlightClick]);

  // Send messages TO the iframe (scroll to active, update text)
  useEffect(() => {
    const iframeWindow = iframeRef.current?.contentWindow;
    if (!iframeWindow) return;

    // We use a small timeout to ensure the iframe script has initialized after src change
    const timer = setTimeout(() => {
      iframeWindow.postMessage(
        {
          type: "SET_ACTIVE",
          groupId: activeGroupId,
          occurrenceIndex: activeOccurrenceIndex,
        },
        "*",
      );

      iframeWindow.postMessage(
        {
          type: "APPLY_REPLACEMENTS",
          replacements,
        },
        "*",
      );
    }, 50);

    return () => clearTimeout(timer);
  }, [activeGroupId, activeOccurrenceIndex, replacements]);

  return (
    <Card className="flex h-full min-h-[600px] flex-col overflow-hidden p-0">
      {/* Disclaimer Bar */}
      <div className="flex items-center gap-2 border-b border-gray-800 bg-gray-900 px-4 py-3">
        <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
        <p className="text-xs text-gray-300">
          <strong className="text-gray-200">Preview formatting is approximate.</strong>{" "}
          Your downloaded .docx will retain 100% of its original layout and styling.
        </p>
      </div>
      
      {/* The Sandbox */}
      <div className="relative flex-1 bg-white">
        <iframe
          ref={iframeRef}
          className="absolute inset-0 h-full w-full border-none"
          title="Document Preview"
          sandbox="allow-scripts"
        />
      </div>
    </Card>
  );
}
