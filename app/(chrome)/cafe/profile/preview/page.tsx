import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Eye } from "lucide-react";
import { requireShop } from "@/lib/auth";
import { CafeCard } from "@/components/cafe-card";
import { getDict } from "@/lib/i18n";

export const metadata: Metadata = { title: "Café preview" };

export default async function CafePreviewPage() {
  const { profile, shop } = await requireShop();

  const d = await getDict();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/cafe/profile"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> {d.shopForm.previewBack}
      </Link>

      <p className="bubble-in mb-6 inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
        <Eye className="size-4 shrink-0" />
        {d.shopForm.previewNote}
      </p>

      <CafeCard shop={shop} avatarUrl={profile.avatar_url} className="rise-in" />

      {!shop.is_published ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Your café is currently unpublished, so baristas can&apos;t see it yet — flip the
          Published switch on your{" "}
          <Link href="/cafe/profile" className="text-accent hover:underline">
            café profile
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}
