"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type NavLink = { href: string; label: string };

export function NavLinks({ links, className }: { links: NavLink[]; className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={cn("items-center gap-1", className)}>
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "pressable rounded-sm px-3 py-1.5 text-sm transition-colors duration-150",
              active
                ? "font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
