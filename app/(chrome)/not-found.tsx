import Link from "next/link";
import { Coffee } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-28 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Coffee className="size-7" strokeWidth={1.5} />
      </span>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Nothing brewing here</h1>
      <p className="text-muted-foreground">
        This page doesn&apos;t exist — or the gig behind it is long gone.
      </p>
      <Link
        href="/"
        className="pressable mt-2 inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Back to the start
      </Link>
    </div>
  );
}
