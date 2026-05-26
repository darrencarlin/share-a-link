"use client";

import { Badge } from "@/components/ui/badge";
import { LinkIcon, ClipboardPaste, Sparkles } from "lucide-react";
import Link from "next/link";

type BoardHeaderProps = {
  name: string;
  shortCode: string;
  pasting: boolean;
};

export function BoardHeader({ name, shortCode, pasting }: BoardHeaderProps) {
  return (
    <header className="flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
              <LinkIcon className="size-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">{name}</span>
          </Link>
          <Badge variant="secondary" className="font-mono text-xs">
            /s/{shortCode}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {pasting ? (
            <span className="flex items-center gap-1.5">
              <Sparkles className="size-4 animate-spin" />
              Saving…
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <ClipboardPaste className="size-4" />
              Paste to add
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
