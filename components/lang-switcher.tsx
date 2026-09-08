"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Languages } from "lucide-react";

const MARKETING_PATHS = ["/", "/for-cafes", "/for-baristas"];

/** EN ⇄ FR toggle, shown only on pages that exist in both languages. */
export function LangSwitcher() {
  const pathname = usePathname();
  const isFr = pathname === "/fr" || pathname.startsWith("/fr/");
  const base = isFr ? (pathname === "/fr" ? "/" : pathname.slice(3)) : pathname;
  if (!MARKETING_PATHS.includes(base)) return null;
  const target = isFr ? base : base === "/" ? "/fr" : `/fr${base}`;

  return (
    <Link
      href={target}
      className="inline-flex items-center gap-1.5 transition-colors duration-150 hover:text-foreground"
    >
      <Languages className="size-3.5" />
      {isFr ? "English" : "Français"}
    </Link>
  );
}
