import Image from "next/image";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";

export function Avatar({
  name,
  src,
  className,
}: {
  name: string;
  src?: string | null;
  className?: string;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt=""
        aria-hidden
        width={96}
        height={96}
        className={cn("size-9 shrink-0 rounded-full object-cover", className)}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-9 shrink-0 select-none items-center justify-center rounded-full bg-accent-soft text-[13px] font-semibold text-accent",
        className,
      )}
    >
      {initials(name) || "?"}
    </span>
  );
}
