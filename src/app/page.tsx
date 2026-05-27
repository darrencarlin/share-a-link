"use client";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { authClient } from "@/lib/auth-client";
import { useIsMac } from "@/hooks/use-is-mac";
import { extractUrl } from "@/utils/extract-url";
import { useMutation, useQuery } from "convex/react";
import { ClipboardPaste, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";

export default function Home() {
  const { push } = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const board = useQuery(
    api.boards.getByOwnerId,
    session?.user?.id ? { ownerId: session.user.id } : "skip",
  );
  const createBoard = useMutation(api.boards.create);
  const addLink = useMutation(api.links.add);
  const [pasting, setPasting] = useState(false);
  const isMac = useIsMac();

  useEffect(() => {
    if (session?.user && board === null) {
      createBoard({
        ownerId: session.user.id,
        name: session.user.name || "My Links",
      });
    }
  }, [session, board, createBoard]);

  useEffect(() => {
    if (!session?.user || !board) return;

    const pendingUrl = localStorage.getItem("pendingUrl");
    if (!pendingUrl) return;
    localStorage.removeItem("pendingUrl");

    (async () => {
      setPasting(true);
      try {
        const linkId = await addLink({
          boardId: board._id,
          url: pendingUrl,
          createdById: session.user.id,
          createdByName: session.user.name || "Unknown",
        });
        toast.success("Link saved! AI is categorizing it...");
        push(`/s/${board.shortCode}`);

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
    })();
  }, [session, board, addLink, push]);

  useEffect(() => {
    async function handlePaste(e: ClipboardEvent) {
      const text = e.clipboardData?.getData("text/plain");
      if (!text) return;

      const url = extractUrl(text);
      if (!url) {
        toast.error("No valid URL found in clipboard");
        return;
      }

      if (!session?.user) {
        localStorage.setItem("pendingUrl", url);
        toast("Sign in to save links");
        authClient.signIn.social({ provider: "google" });
        return;
      }

      if (!board) {
        toast.error("Setting up your board...");
        return;
      }

      setPasting(true);
      try {
        const linkId = await addLink({
          boardId: board._id,
          url,
          createdById: session.user.id,
          createdByName: session.user.name || "Unknown",
        });
        toast.success("Link saved! AI is categorizing it...");
        push(`/s/${board.shortCode}`);

        await fetch("/api/categorize", {
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
  }, [session, board, addLink, push]);

  return (
    <div className="relative flex h-dvh w-full flex-col items-center justify-center bg-background px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="flex max-w-2xl flex-col items-center gap-8 text-center">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Share a Link
          </h1>
        </div>

        <p className="text-xl text-muted-foreground leading-relaxed max-w-md">
          Share links with friends, let AI organize
        </p>

        <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-muted-foreground/25 bg-muted/50 px-12 py-10 transition-colors hover:border-muted-foreground/40">
          <ClipboardPaste className="size-10 text-muted-foreground/60" />
          <p className="text-lg font-medium">
            {pasting ? (
              <span className="flex items-center gap-2">
                <Sparkles className="size-5 animate-spin" />
                Saving link…
              </span>
            ) : (
              <>
                Press{" "}
                <kbd className="rounded-md border bg-background px-2 py-0.5 text-sm font-mono">
                  {isMac ? "⌘" : "Ctrl"}+V
                </kbd>{" "}
                to paste a link
              </>
            )}
          </p>
          <p className="text-sm text-muted-foreground">
            Paste any URL and AI will categorize it instantly
          </p>
        </div>

        {!isPending && !session && (
          <Button
            size="lg"
            onClick={() => authClient.signIn.social({ provider: "google" })}
            className="gap-2"
          >
            Sign in with Google to get started
          </Button>
        )}

        {session && board && (
          <p className="text-sm text-muted-foreground">
            Your board:{" "}
            <a
              href={`/s/${board.shortCode}`}
              className="font-medium text-foreground underline underline-offset-4"
            >
              /s/{board.shortCode}
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
