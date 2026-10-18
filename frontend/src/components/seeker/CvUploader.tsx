"use client";

import { FileText, UploadCloud } from "lucide-react";
import { useId, useRef, useState, type DragEvent } from "react";
import { Notice } from "@/components/ui";
import { cn } from "@/lib/utils";

const MAX_MB = 5;

/** Returns a message if the file is not acceptable, otherwise null. */
export function validateCv(file: File): string | null {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return "Upload your CV as a PDF file.";
  if (file.size > MAX_MB * 1024 * 1024) return `That file is larger than ${MAX_MB} MB. Upload a smaller PDF.`;
  return null;
}

type Props = {
  busy: boolean;
  fileName: string | null;
  onFile: (file: File) => void;
};

export function CvUploader({ busy, fileName, onFile }: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  function take(file: File | undefined) {
    if (!file) return;
    const error = validateCv(file);
    setProblem(error);
    if (!error) onFile(file);
  }

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragging(false);
    if (!busy) take(e.dataTransfer.files?.[0]);
  }

  return (
    <div className="space-y-3">
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors",
          "focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent",
          dragging ? "border-accent bg-accent-soft" : "border-line hover:border-accent/60 hover:bg-sunken",
          busy && "pointer-events-none opacity-60",
        )}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
          {fileName && busy ? <FileText size={24} aria-hidden /> : <UploadCloud size={24} aria-hidden />}
        </span>
        <span>
          <span className="block font-medium">{fileName ? fileName : "Drop your CV here, or choose a file"}</span>
          <span className="block text-sm text-muted">PDF only, up to {MAX_MB} MB</span>
        </span>
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          disabled={busy}
          onChange={(e) => {
            take(e.target.files?.[0]);
            e.target.value = ""; // lets the same file be chosen again
          }}
        />
      </label>
      {problem && <Notice kind="error">{problem}</Notice>}
    </div>
  );
}
