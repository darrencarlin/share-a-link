"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LinkIcon, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { getDomain } from "@/utils/get-domain";
import { timeAgo } from "@/utils/time-ago";
import type { Id } from "../../../../convex/_generated/dataModel";

type LinkItem = {
  _id: Id<"links">;
  url: string;
  ogTitle?: string | undefined;
  category?: string | undefined;
  summary?: string | undefined;
  status: "categorizing" | "done" | "error";
  createdByName?: string | undefined;
  createdAt: number;
};

type LinkListProps = {
  links: LinkItem[];
  isOwner: boolean;
  onDelete: (id: Id<"links">) => void;
  onCategoryClick: (category: string) => void;
};

export function LinkList({
  links,
  isOwner,
  onDelete,
  onCategoryClick,
}: LinkListProps) {
  return (
    <div className="divide-y divide-border">
      {links.map((link) => (
        <div
          key={link._id}
          className="group flex items-center gap-4 py-3 px-2 -mx-2 rounded-lg transition-colors hover:bg-muted/50"
        >
          <div className="flex size-9 flex-shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <LinkIcon className="size-4" />
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
              <ExternalLink className="hidden size-3 flex-shrink-0 text-muted-foreground group-hover:block" />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="truncate">{getDomain(link.url)}</span>
              <span className="text-border">·</span>
              <span className="flex-shrink-0">
                {link.createdByName || "Anonymous"} · {timeAgo(link.createdAt)}
              </span>
              {link.status === "categorizing" ? (
                <>
                  <span className="text-border">·</span>
                  <span className="flex items-center gap-1">
                    <Loader2 className="size-3 animate-spin" />
                    Categorizing…
                  </span>
                </>
              ) : (
                link.summary && (
                  <>
                    <span className="text-border hidden sm:inline">·</span>
                    <span className="truncate hidden sm:inline">
                      {link.summary}
                    </span>
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
                  onClick={() => onCategoryClick(link.category!)}
                >
                  {link.category}
                </Badge>
              )
            )}
            {isOwner && (
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive"
                onClick={() => onDelete(link._id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
