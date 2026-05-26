"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LinkIcon, ClipboardPaste, Sparkles } from "lucide-react";

function extractUrl(text: string): string | null {
  const match = text.match(
    /https?:\/\/[^\s<>"{}|\\^`[\]]+/i
  );
  return match ? match[0] : null;
}

export default function Home() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const board = useQuery(
    api.boards.getByOwnerId,
    session?.user?.id ? { ownerId: session.user.id } : "skip"
  );
  const createBoard = useMutation(api.boards.create);
  const addLink = useMutation(api.links.add);
  const [pasting, setPasting] = useState(false);

  useEffect(() => {
    if (session?.user && board === null) {
      createBoard({
        ownerId: session.user.id,
        name: session.user.name || "My Links",
      });
    }
  }, [session, board, createBoard]);

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
        const linkId = await addLink({ boardId: board._id, url });
        toast.success("Link saved! AI is categorizing it...");
        router.push(`/s/${board.shortCode}`);

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
  }, [session, board, addLink, router]);

  return (
    <div className="flex h-dvh w-full flex-col items-center justify-center bg-background px-4">
      <div className="flex max-w-2xl flex-col items-center gap-8 text-center">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <LinkIcon className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Share a Link
          </h1>
        </div>

        <p className="text-xl text-muted-foreground leading-relaxed max-w-md">
          Share links with friends, let AI organize
        </p>

        <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-muted-foreground/25 bg-muted/50 px-12 py-10 transition-colors hover:border-muted-foreground/40">
          <ClipboardPaste className="h-10 w-10 text-muted-foreground/60" />
          <p className="text-lg font-medium">
            {pasting ? (
              <span className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 animate-spin" />
                Saving link...
              </span>
            ) : (
              <>
                Press{" "}
                <kbd className="rounded-md border bg-background px-2 py-0.5 text-sm font-mono">
                  {typeof navigator !== "undefined" &&
                  navigator.userAgent.includes("Mac")
                    ? "⌘"
                    : "Ctrl"}
                  +V
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
