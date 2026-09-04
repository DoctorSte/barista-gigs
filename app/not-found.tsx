import Image from "next/image";
import Link from "next/link";

// Root-level 404 — catches URLs outside the (chrome) group, so it brings its
// own minimal page instead of the default unstyled one.
export default function RootNotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-4 text-center text-foreground">
      <Image
        src="/mascot.png"
        alt=""
        width={300}
        height={277}
        className="h-auto w-28 opacity-90"
      />
      <h1 className="font-display text-3xl font-semibold tracking-tight">Nothing brewing here</h1>
      <p className="max-w-sm text-muted-foreground">
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
