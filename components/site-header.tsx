import Image from "next/image";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getCityById } from "@/lib/city";
import { createClient } from "@/lib/supabase/server";
import { NavLinks, type NavLink } from "@/components/nav-links";
import { NotificationBell } from "@/components/notification-bell";
import { UserMenu } from "@/components/user-menu";
import type { Notification } from "@/lib/database.types";

const EXTRA_LINKS: NavLink[] = [
  { href: "/gigs", label: "Gigs" },
  { href: "/jobs", label: "Jobs" },
  { href: "/applications", label: "Applications" },
  { href: "/messages", label: "Messages" },
];

const SHOP_LINKS: NavLink[] = [
  { href: "/cafe/dashboard", label: "Dashboard" },
  { href: "/cafe/baristas", label: "Baristas" },
  { href: "/messages", label: "Messages" },
];

const GUEST_LINKS: NavLink[] = [
  { href: "/for-cafes", label: "For cafés" },
  { href: "/for-baristas", label: "For baristas" },
];

export async function SiteHeader() {
  const { user, profile } = await getSession();
  const links = profile ? (profile.role === "shop" ? SHOP_LINKS : EXTRA_LINKS) : GUEST_LINKS;
  const city = profile ? await getCityById(profile.city_id) : null;

  let notifications: Notification[] = [];
  let unreadCount = 0;
  if (user && profile) {
    const supabase = await createClient();
    const [latest, unread] = await Promise.all([
      supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("read_at", null),
    ]);
    notifications = (latest.data ?? []) as Notification[];
    unreadCount = unread.count ?? 0;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-15 max-w-5xl items-center gap-6 px-4 sm:px-6">
        <Link
          href={profile ? (profile.role === "shop" ? "/cafe/dashboard" : "/gigs") : "/"}
          className="pressable flex items-center gap-2 rounded-md font-display text-[17px] font-semibold tracking-tight"
        >
          <Image
            src="/mascot.png"
            alt=""
            width={64}
            height={59}
            priority
            className="size-8 shrink-0 object-contain"
          />
          Barista Gigs
        </Link>

        <NavLinks links={links} className="hidden sm:flex" />

        <div className="ml-auto flex items-center gap-2.5">
          {user && profile ? (
            <>
              <NotificationBell notifications={notifications} unreadCount={unreadCount} />
              <UserMenu
                name={profile.display_name}
                email={user.email ?? ""}
                role={profile.role}
                cityName={city?.name ?? null}
                avatarUrl={profile.avatar_url}
              />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="pressable rounded-sm px-3 py-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="pressable rounded-sm bg-primary px-3.5 py-1.5 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
      {links.length > 0 ? (
        <div className="border-t border-border/60 sm:hidden">
          <NavLinks links={links} className="flex justify-center py-1" />
        </div>
      ) : null}
    </header>
  );
}
