"use client";

import { useEffect, useRef, useState } from "react";
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
  const [iframeReady, setIframeReady] = useState(false);

  // Initialize the iframe content and message listener
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    setIframeReady(false);

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
                  // Center in both axes so highlight is not clipped at edges.
                  targetMark.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'center',
                  });
                }
              }
            }

            if (data.type === 'APPLY_REPLACEMENTS') {
              // The incoming replacements object maps groupId -> newValue
              const currentReplacements = data.replacements || {};
              
              // Apply live text updates to all marks
              marks.forEach(mark => {
                const groupId = mark.getAttribute('data-group-id');
                if (!groupId) return;
                
                const newValue = currentReplacements[groupId];
                if (newValue !== undefined) {
                  // We have a confirmed replacement
                  mark.classList.add('confirmed');
                  mark.textContent = newValue;
                } else {
                  // We don't have a confirmed replacement (could be pending or just undone)
                  mark.classList.remove('confirmed');
                  
                  // Restore the original text
                  const original = mark.getAttribute('data-original');
                  if (original) {
                     mark.textContent = original.replace(/\\\\([.*+?^$\\{}()|[\\]\\\\])/g, '$1');
                  }
                }
              });
            }
          });

          // Signal handshake readiness so parent can post state deterministically.
          window.parent.postMessage({ type: 'IFRAME_READY' }, '*');
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
      if (event.data?.type === "IFRAME_READY") {
        setIframeReady(true);
        return;
      }

      if (event.data?.type === "MARK_CLICKED" && event.data.groupId) {
        onHighlightClick(event.data.groupId);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onHighlightClick]);

  // Send active-focus updates on navigation changes.
  useEffect(() => {
    const iframeWindow = iframeRef.current?.contentWindow;
    if (!iframeWindow || !iframeReady) return;

    iframeWindow.postMessage(
      {
        type: "SET_ACTIVE",
        groupId: activeGroupId,
        occurrenceIndex: activeOccurrenceIndex,
      },
      "*",
    );

  }, [activeGroupId, activeOccurrenceIndex, iframeReady]);

  // Send replacement text updates only when replacement data changes.
  useEffect(() => {
    const iframeWindow = iframeRef.current?.contentWindow;
    if (!iframeWindow || !iframeReady) return;

    iframeWindow.postMessage(
      {
        type: "APPLY_REPLACEMENTS",
        replacements,
      },
      "*",
    );
  }, [replacements, iframeReady]);

  return (
    <Card className="flex h-full min-h-[600px] flex-col overflow-hidden p-0">
      {/* Disclaimer Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
        <p className="text-xs text-slate-700">
          <strong className="text-slate-900">Preview formatting is approximate.</strong>{" "}
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
