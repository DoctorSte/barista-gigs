import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { requireShop } from "@/lib/auth";
import { GigForm } from "@/components/gig-form";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Post a job" };

export default async function NewJobPage() {
  await requireShop();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/cafe/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Dashboard
      </Link>
      <h1 className="mb-1 font-display text-3xl font-semibold tracking-tight">Post a job</h1>
      <p className="mb-8 text-[15px] text-muted-foreground">
        A full- or part-time position at your café. The listing stays live for 90 days and goes
        out to every barista in your city.
      </p>
      <Card>
        <GigForm mode="job" />
      </Card>
    </div>
  );
}
