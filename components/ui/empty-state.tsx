import Image from "next/image";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  mascot = false,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  /** Show the mascot instead of an icon — for the big "nothing here yet" moments. */
  mascot?: boolean;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rise-in flex flex-col items-center gap-3 rounded-lg border border-dashed border-border-strong/70 px-6 py-14 text-center">
      {mascot ? (
        <Image
          src="/mascot.png"
          alt=""
          width={300}
          height={277}
          className="h-auto w-24 opacity-80 grayscale-[0.2]"
        />
      ) : Icon ? (
        <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="size-5" strokeWidth={1.75} />
        </span>
      ) : null}
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description ? (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
