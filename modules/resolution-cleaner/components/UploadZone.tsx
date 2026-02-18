"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  onFileSelected: (file: File) => void;
  error?: string | null;
}

export function UploadZone({ onFileSelected, error }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function selectFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".docx")) {
      onFileSelected(file);
      return;
    }
    onFileSelected(file);
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        className="w-full text-left"
        onClick={() => inputRef.current?.click()}
        onDragEnter={() => setIsDragging(true)}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          const file = event.dataTransfer.files?.[0];
          if (file) {
            selectFile(file);
          }
        }}
      >
        <Card
          className={cn(
            "flex min-h-48 w-full flex-col items-center justify-center border-2 border-dashed text-center",
            isDragging
              ? "border-gray-500 bg-gray-800/40"
              : "border-gray-700 hover:border-gray-600",
            error && "border-red-700 bg-red-950/10",
          )}
        >
          <Upload className="h-10 w-10 text-gray-300" aria-hidden="true" />
          <p className="mt-4 text-sm font-medium text-white">Drop your resolution here</p>
          <p className="mt-1 text-sm text-gray-400">or click to browse</p>
          <p className="mt-3 text-xs text-gray-500">.docx files only — max 10MB</p>
        </Card>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            selectFile(file);
          }
        }}
      />

      {error ? (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}

