"use client";

import Link from "next/link";
import { BookUser, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDict } from "@/components/i18n-provider";

export function PassportLink({ username }: { username: string }) {
  const d = useDict();
  const path = `/@${username}/passport`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      toast.success(d.uploads.passportCopied);
    } catch {
      toast.error(d.common.copyFailed);
    }
  }

  return (
    <Card className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-start gap-2.5">
        <BookUser className="mt-0.5 size-5 shrink-0 text-accent" />
        <div>
          <h2 className="font-display text-lg font-semibold">Barista Passport</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {d.profile.passportShare}
          </p>
          <p className="mt-2 inline-flex rounded-full border border-border bg-muted px-3.5 py-1.5 font-mono text-[13px] text-muted-foreground">
            {path}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={copy}>
          <Copy className="size-3.5" /> {d.profile.copyLink}
        </Button>
        <Link
          href={path}
          target="_blank"
          className="pressable inline-flex h-8 items-center gap-1.5 rounded-sm border border-border px-3 text-[13px] font-medium text-muted-foreground hover:border-border-strong hover:text-foreground"
        >
          <ExternalLink className="size-3.5" /> {d.profile.view}
        </Link>
      </div>
    </Card>
  );
}
