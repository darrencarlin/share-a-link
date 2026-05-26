"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { User } from "lucide-react";

export function ClaimBanner({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <div className="flex-shrink-0 border-b bg-primary/5 px-6 py-2.5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <User className="mr-1.5 inline size-3.5" />
          You added {count} link{count === 1 ? "" : "s"}. Sign in to claim{" "}
          {count === 1 ? "it" : "them"}
        </p>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={() => authClient.signIn.social({ provider: "google" })}
        >
          Sign in with Google
        </Button>
      </div>
    </div>
  );
}
