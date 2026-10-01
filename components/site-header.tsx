import Image from "next/image";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getCityById } from "@/lib/city";
import { createClient } from "@/lib/supabase/server";
import { NavLinks, type NavLink } from "@/components/nav-links";
import { NotificationBell } from "@/components/notification-bell";
import { UserMenu } from "@/components/user-menu";
import { getDict } from "@/lib/i18n";
import type { Notification } from "@/lib/database.types";

export async function SiteHeader() {
  const { user, profile } = await getSession();
  const d = await getDict();

  const EXTRA_LINKS: NavLink[] = [
    { href: "/gigs", label: d.nav.gigs },
    { href: "/jobs", label: d.nav.jobs },
    { href: "/applications", label: d.nav.applications },
    { href: "/schedule", label: d.nav.schedule },
    { href: "/messages", label: d.nav.messages },
  ];
  const SHOP_LINKS: NavLink[] = [
    { href: "/cafe/dashboard", label: d.nav.dashboard },
    { href: "/cafe/planner", label: d.nav.planner },
    { href: "/cafe/baristas", label: d.nav.baristas },
    { href: "/messages", label: d.nav.messages },
  ];
  const GUEST_LINKS: NavLink[] = [
    { href: "/for-cafes", label: d.nav.forCafes },
    { href: "/for-baristas", label: d.nav.forBaristas },
  ];
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
      <div className="mx-auto flex h-15 max-w-5xl items-center gap-4 px-4 sm:gap-6 sm:px-6">
        <Link
          href={profile ? (profile.role === "shop" ? "/cafe/dashboard" : "/gigs") : "/"}
          className="pressable flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md font-display text-[17px] font-semibold tracking-tight"
        >
          <Image
            src="/mascot.png"
            alt="Barista Gigs"
            width={64}
            height={59}
            priority
            className="size-8 shrink-0 object-contain"
          />
          {/* On the narrowest phones the mascot carries the brand alone —
              better than "Barista / Gigs" wrapping against the buttons. */}
          <span className="max-[379px]:hidden">Barista Gigs</span>
        </Link>

        <NavLinks links={links} className="hidden sm:flex" />

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2.5">
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
                className="pressable shrink-0 whitespace-nowrap rounded-sm px-2.5 py-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground sm:px-3"
              >
                {d.common.logIn}
              </Link>
              <Link
                href="/signup"
                className="pressable shrink-0 whitespace-nowrap rounded-sm bg-primary px-3 py-1.5 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 sm:px-3.5"
              >
                {d.common.signUp}
              </Link>
            </>
          )}
        </div>
      </div>
      {links.length > 0 ? (
        <div className="border-t border-border/60 sm:hidden">
          {/* Scrolls sideways instead of shrinking links until words break;
              "safe center" keeps it centered only while everything fits. */}
          <NavLinks
            links={links}
            className="flex overflow-x-auto px-3 py-1 [justify-content:safe_center] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          />
        </div>
      ) : null}
    </header>
  );
}
