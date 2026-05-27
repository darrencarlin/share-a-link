"use client";

import { Button } from "@/components/ui/button";
import { ClipboardPaste, Loader2 } from "lucide-react";

type PasteButtonProps = {
  pasting: boolean;
  onPaste: () => void;
};

export function PasteButton({ pasting, onPaste }: PasteButtonProps) {
  return (
    <div className="flex-shrink-0 border-t bg-background px-4 py-3 sm:hidden">
      <button
        type="button"
        onClick={onPaste}
        disabled={pasting}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-muted-foreground/25 bg-muted/40 px-4 py-4 text-sm font-medium text-muted-foreground shadow-inner transition-colors active:bg-muted/60 disabled:opacity-50"
      >
        {pasting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <ClipboardPaste className="size-4" />
        )}
        {pasting ? "Saving…" : "Tap to paste a link"}
      </button>
    </div>
  );
}
