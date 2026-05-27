import { useCallback, useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "../../../../convex/_generated/api";
import { extractUrl } from "@/utils/extract-url";
import { addUnclaimedLink } from "@/features/links/utils/unclaimed-storage";
import type { Id } from "../../../../convex/_generated/dataModel";

type PasteHandlerOptions = {
  boardId: Id<"boards"> | undefined;
  boardCode: string | undefined;
  userId: string | undefined;
  userName: string | undefined;
  onSaved?: (linkId: Id<"links">) => void;
};

export function usePasteHandler({
  boardId,
  boardCode,
  userId,
  userName,
  onSaved,
}: PasteHandlerOptions) {
  const addLink = useMutation(api.links.add);
  const [pasting, setPasting] = useState(false);

  const saveUrl = useCallback(
    async (url: string) => {
      if (!boardId) return;

      setPasting(true);
      try {
        const linkId = await addLink({
          boardId,
          url,
          createdById: userId,
          createdByName: userName || undefined,
        });
        toast.success("Link saved! AI is categorizing it...");

        if (!userId && boardCode) {
          addUnclaimedLink(boardCode, linkId);
        }

        onSaved?.(linkId);

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
    },
    [boardId, boardCode, userId, userName, addLink, onSaved],
  );

  useEffect(() => {
    async function handlePaste(e: ClipboardEvent) {
      const text = e.clipboardData?.getData("text/plain");
      if (!text) return;

      const url = extractUrl(text);
      if (!url) {
        toast.error("No valid URL found in clipboard");
        return;
      }

      await saveUrl(url);
    }

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [saveUrl]);

  const pasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      const url = extractUrl(text);
      if (!url) {
        toast.error("No valid URL found in clipboard");
        return;
      }
      await saveUrl(url);
    } catch {
      toast.error("Clipboard access denied. Copy a link and try again.");
    }
  }, [saveUrl]);

  return { pasting, pasteFromClipboard };
}
