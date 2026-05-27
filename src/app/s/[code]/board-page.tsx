"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ClipboardPaste, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useIsMac } from "@/hooks/use-is-mac";
import { usePasteHandler } from "@/features/links/hooks/use-paste-handler";
import {
  getUnclaimedLinks,
  clearUnclaimedLinks,
} from "@/features/links/utils/unclaimed-storage";
import { BoardHeader } from "@/features/boards/components/board-header";
import { CategoryBar } from "@/features/links/components/category-bar";
import { ClaimBanner } from "@/features/links/components/claim-banner";
import { LinkList } from "@/features/links/components/link-list";
import { PasteButton } from "@/features/links/components/paste-button";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function BoardPage({ code }: { code: string }) {
  const { data: session } = authClient.useSession();
  const board = useQuery(api.boards.getByShortCode, { shortCode: code });
  const links = useQuery(
    api.links.listByBoard,
    board ? { boardId: board._id } : "skip",
  );
  const claimLinks = useMutation(api.links.claim);
  const removeLink = useMutation(api.links.remove);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const claimedRef = useRef(false);
  const isMac = useIsMac();

  const isOwner = session?.user?.id === board?.ownerId;

  const unclaimedCount = useMemo(() => getUnclaimedLinks(code).length, [code]);

  const onLinkSaved = useCallback(() => {
    // Unclaimed count updates reactively via useMemo on next render
  }, []);

  const { pasting, pasteFromClipboard } = usePasteHandler({
    boardId: board?._id,
    boardCode: code,
    userId: session?.user?.id,
    userName: session?.user?.name,
    onSaved: onLinkSaved,
  });

  useEffect(() => {
    if (!session?.user || !board || claimedRef.current) return;

    const unclaimed = getUnclaimedLinks(code);
    if (unclaimed.length === 0) return;

    claimedRef.current = true;
    (async () => {
      try {
        await claimLinks({
          linkIds: unclaimed as Id<"links">[],
          boardId: board._id,
          userId: session.user.id,
          userName: session.user.name || "Unknown",
        });
        clearUnclaimedLinks(code);
        toast.success(
          `Claimed ${unclaimed.length} link${unclaimed.length === 1 ? "" : "s"}!`,
        );
      } catch {
        claimedRef.current = false;
      }
    })();
  }, [session, board, code, claimLinks]);

  const filteredLinks = useMemo(() => {
    if (!links) return undefined;
    if (!activeCategory) return links;
    return links.filter((l) => l.category === activeCategory);
  }, [links, activeCategory]);

  if (board === undefined) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (board === null) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">Board not found</p>
        <Button variant="outline" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 size-4" />
            Go home
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-background">
      <BoardHeader
        name={board.name}
        shortCode={board.shortCode}
        pasting={pasting}
      />

      {!session && <ClaimBanner count={unclaimedCount} />}

      <CategoryBar
        links={links}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      <main className="flex-1 overflow-y-auto p-2 md:p-6">
        {filteredLinks === undefined ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredLinks.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <ClipboardPaste className="size-12 text-muted-foreground/40" />
            <div>
              <p className="text-lg font-medium">
                {activeCategory ? `No ${activeCategory} links` : "No links yet"}
              </p>
              <p className="text-sm text-muted-foreground">
                {activeCategory ? (
                  <button
                    type="button"
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
          <LinkList
            links={filteredLinks}
            isOwner={isOwner}
            onDelete={(id) => removeLink({ id })}
            onCategoryClick={setActiveCategory}
          />
        )}
      </main>

      <PasteButton pasting={pasting} onPaste={pasteFromClipboard} />
    </div>
  );
}
