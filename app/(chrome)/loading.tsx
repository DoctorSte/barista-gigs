// Paints instantly on navigation while the server renders — quiet gray
// echoes of a page: title, hint, then section rules. Shared by every
// app route under the chrome layout.
export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6" aria-busy>
      <div className="animate-pulse">
        <div className="h-9 w-56 rounded-md bg-muted" />
        <div className="mt-3 h-4 w-80 max-w-full rounded bg-muted/70" />
        <div className="mt-12 flex flex-col gap-10">
          {[0, 1, 2].map((i) => (
            <div key={i} className="grid gap-x-12 gap-y-4 border-t border-border/70 pt-9 md:grid-cols-[200px_minmax(0,1fr)]">
              <div>
                <div className="h-3 w-24 rounded bg-muted" />
                <div className="mt-3 h-3 w-32 rounded bg-muted/60" />
              </div>
              <div>
                <div className="h-10 w-full rounded-md bg-muted/60" />
                <div className="mt-3 h-10 w-2/3 rounded-md bg-muted/40" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
