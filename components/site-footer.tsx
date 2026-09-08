import Link from "next/link";
import { LangSwitcher } from "@/components/lang-switcher";
import { getDict } from "@/lib/i18n";

export async function SiteFooter() {
  const d = await getDict();
  const links = [
    { href: "/for-cafes", label: d.nav.forCafes },
    { href: "/for-baristas", label: d.nav.forBaristas },
    { href: "/legal/terms", label: d.nav.terms },
    { href: "/legal/privacy", label: d.nav.privacy },
    { href: "/legal/disclaimer", label: d.nav.disclaimers },
  ];

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-6 text-[13px] text-muted-foreground sm:px-6">
        <p>
          © {new Date().getFullYear()} Barista Gigs ·{" "}
          <span className="font-display italic">{d.nav.tagline}</span>
        </p>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <LangSwitcher />
          {links.map((link) => (
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
