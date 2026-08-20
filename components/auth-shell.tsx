export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 pb-24 pt-16 sm:pt-24">
      <div className="rise-in space-y-1.5 text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? <p className="text-[15px] text-muted-foreground">{subtitle}</p> : null}
      </div>
      <div className="rise-in rounded-lg border border-border bg-surface p-6 shadow-[0_1px_2px_rgb(0_0_0/0.04)] [animation-delay:60ms]">
        {children}
      </div>
      {footer ? (
        <div className="rise-in text-center text-sm text-muted-foreground [animation-delay:120ms]">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
