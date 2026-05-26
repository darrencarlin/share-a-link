"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LinkIcon,
  Trash2,
  ExternalLink,
  ClipboardPaste,
  Sparkles,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { Id } from "../../../../convex/_generated/dataModel";

const CATEGORIES = [
  "article", "blog", "news", "video", "podcast", "music",
  "tool", "app", "library", "framework", "api", "documentation",
  "tutorial", "course", "book", "research", "paper", "reference",
  "social", "forum", "community", "shopping", "product", "deal",
  "entertainment", "game", "meme", "humor", "design", "inspiration",
  "portfolio", "startup", "business", "finance", "crypto", "ai",
  "machine-learning", "data-science", "devops", "security", "open-source",
  "job", "career", "event", "conference", "recipe", "health", "fitness",
  "travel", "science", "space", "politics", "environment", "education",
  "photography", "other",
];

const subscribe = () => () => {};
const getIsMac = () => navigator.userAgent.includes("Mac");
const getIsMacServer = () => false;

function extractUrl(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s<>"{}|\\^`[\]]+/i);
  return match ? match[0] : null;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

export default function BoardPage({ code }: { code: string }) {
  const { data: session } = authClient.useSession();
  const board = useQuery(api.boards.getByShortCode, { shortCode: code });
  const links = useQuery(
    api.links.listByBoard,
    board ? { boardId: board._id } : "skip"
  );
  const addLink = useMutation(api.links.add);
  const removeLink = useMutation(api.links.remove);
  const [pasting, setPasting] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const isMac = useSyncExternalStore(subscribe, getIsMac, getIsMacServer);

  const isOwner = session?.user?.id === board?.ownerId;

  const activeCategories = useMemo(() => {
    if (!links) return new Set<string>();
    const cats = new Set<string>();
    for (const link of links) {
      if (link.category) cats.add(link.category);
    }
    return cats;
  }, [links]);

  const filteredLinks = useMemo(() => {
    if (!links) return undefined;
    if (!activeCategory) return links;
    return links.filter((l) => l.category === activeCategory);
  }, [links, activeCategory]);

  useEffect(() => {
    async function handlePaste(e: ClipboardEvent) {
      const text = e.clipboardData?.getData("text/plain");
      if (!text) return;

      const url = extractUrl(text);
      if (!url) {
        toast.error("No valid URL found in clipboard");
        return;
      }

      if (!board) return;

      setPasting(true);
      try {
        const linkId = await addLink({ boardId: board._id, url });
        toast.success("Link saved! AI is categorizing it...");

        fetch("/api/categorize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ linkId }),
        });
      } catch {
        toast.error("Failed to save link");
      } finally {
        setPasting(false);
      }
    }

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [board, addLink]);

  if (board === undefined) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (board === null) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">Board not found</p>
        <Button variant="outline" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go home
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-background">
      <header className="flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <LinkIcon className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">{board.name}</span>
            </Link>
            <Badge variant="secondary" className="font-mono text-xs">
              /s/{board.shortCode}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {pasting ? (
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 animate-spin" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <ClipboardPaste className="h-4 w-4" />
                Paste to add
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="flex-shrink-0 border-b bg-muted/30">
        <div className="flex items-center gap-1.5 overflow-x-auto px-6 py-2 scrollbar-none">
          <button
            onClick={() => setActiveCategory(null)}
            className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              activeCategory === null
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            All{links ? ` (${links.length})` : ""}
          </button>
          {CATEGORIES.filter((cat) => activeCategories.has(cat)).map((cat) => {
            const count = links?.filter((l) => l.category === cat).length ?? 0;
            return (
              <button
                key={cat}
                onClick={() =>
                  setActiveCategory(activeCategory === cat ? null : cat)
                }
                className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <main className="flex-1 overflow-y-auto px-6 py-6">
        {filteredLinks === undefined ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredLinks.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <ClipboardPaste className="h-12 w-12 text-muted-foreground/40" />
            <div>
              <p className="text-lg font-medium">
                {activeCategory ? `No ${activeCategory} links` : "No links yet"}
              </p>
              <p className="text-sm text-muted-foreground">
                {activeCategory ? (
                  <button
                    onClick={() => setActiveCategory(null)}
                    className="underline underline-offset-4 hover:text-foreground"
                  >
                    Clear filter
                  </button>
                ) : (
                  <>
                    Press{" "}
                    <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs">
                      {isMac ? "⌘" : "Ctrl"}+V
                    </kbd>{" "}
                    to paste your first link
                  </>
                )}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredLinks.map((link) => (
              <div
                key={link._id}
                className="group flex items-center gap-4 py-3 px-2 -mx-2 rounded-lg transition-colors hover:bg-muted/50"
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <LinkIcon className="h-4 w-4" />
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate font-medium hover:underline"
                    >
                      {link.ogTitle || getDomain(link.url)}
                    </a>
                    <ExternalLink className="hidden h-3 w-3 flex-shrink-0 text-muted-foreground group-hover:block" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="truncate">{getDomain(link.url)}</span>
                    {link.status === "categorizing" ? (
                      <>
                        <span className="text-border">·</span>
                        <span className="flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Categorizing...
                        </span>
                      </>
                    ) : (
                      link.summary && (
                        <>
                          <span className="text-border">·</span>
                          <span className="truncate">{link.summary}</span>
                        </>
                      )
                    )}
                  </div>
                </div>

                <div className="flex flex-shrink-0 items-center gap-2">
                  {link.status === "categorizing" ? (
                    <div className="h-5 w-14 animate-pulse rounded-full bg-muted" />
                  ) : (
                    link.category && (
                      <Badge
                        variant="secondary"
                        className="cursor-pointer text-xs"
                        onClick={() => setActiveCategory(link.category!)}
                      >
                        {link.category}
                      </Badge>
                    )
                  )}
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive"
                      onClick={() =>
                        removeLink({ id: link._id as Id<"links"> })
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
