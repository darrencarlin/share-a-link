"use client";

import { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function LinksRedirect() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const board = useQuery(
    api.boards.getByOwnerId,
    session?.user?.id ? { ownerId: session.user.id } : "skip"
  );

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/");
      return;
    }
    if (board) {
      router.replace(`/s/${board.shortCode}`);
    }
  }, [session, isPending, board, router]);

  return (
    <div className="flex h-dvh items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
