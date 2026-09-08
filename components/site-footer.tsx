import Link from "next/link";

const LEGAL_LINKS = [
  { href: "/for-cafes", label: "For cafés" },
  { href: "/for-baristas", label: "For baristas" },
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/legal/disclaimer", label: "Disclaimers" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-6 text-[13px] text-muted-foreground sm:px-6">
        <p>
          © {new Date().getFullYear()} Barista Gigs ·{" "}
          <span className="font-display italic">Pour decisions welcome.</span>
        </p>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-1">
          {LEGAL_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors duration-150 hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
