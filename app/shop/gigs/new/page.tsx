import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { requireShop } from "@/lib/auth";
import { GigForm } from "@/components/gig-form";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Post a gig" };

export default async function NewGigPage() {
  await requireShop();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/shop/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Dashboard
      </Link>
      <h1 className="mb-1 font-display text-3xl font-semibold tracking-tight">Post a gig</h1>
      <p className="mb-8 text-[15px] text-muted-foreground">
        It goes live to every barista in your city the moment you publish.
      </p>
      <Card>
        <GigForm />
      </Card>
    </div>
  );
}
