"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useDict } from "@/components/i18n-provider";

export function ReferralLink({ code }: { code: string }) {
  const d = useDict();
  const path = `/r/${code}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      toast.success(d.common.copied);
    } catch {
      toast.error(d.common.copyFailed);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="min-w-0 flex-1 truncate rounded-full border border-border bg-muted px-3.5 py-1.5 font-mono text-[13px] text-muted-foreground">
        {path}
      </span>
      <Button type="button" variant="outline" size="sm" onClick={copy} className="shrink-0">
        <Copy className="size-3.5" />
        {d.common.copy}
      </Button>
    </div>
  );
}
