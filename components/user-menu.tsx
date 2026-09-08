"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  BellRing,
  CreditCard,
  Languages,
  LogOut,
  MapPin,
  Moon,
  Store,
  Sun,
  UserRound,
} from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { setLocale } from "@/app/actions/locale";
import { Avatar } from "@/components/ui/avatar";
import { Menu, MenuItem, MenuLabel, MenuSeparator } from "@/components/ui/menu";
import { useDict, useLocale } from "@/components/i18n-provider";

export function UserMenu({
  name,
  email,
  role,
  cityName,
  avatarUrl,
}: {
  name: string;
  email: string;
  role: "shop" | "extra";
  cityName: string | null;
  avatarUrl: string | null;
}) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const d = useDict();
  const locale = useLocale();

  return (
    <Menu trigger={() => <Avatar name={name} src={avatarUrl} />}>
      <MenuLabel>
        <span className="block truncate font-medium text-foreground">{name}</span>
        <span className="block truncate">{email}</span>
      </MenuLabel>
      <MenuSeparator />
      {role === "extra" ? (
        <MenuItem onSelect={() => router.push("/profile")}>
          <UserRound className="size-4 text-muted-foreground" /> {d.nav.myProfile}
        </MenuItem>
      ) : (
        <>
          <MenuItem onSelect={() => router.push("/cafe/profile")}>
            <Store className="size-4 text-muted-foreground" /> {d.nav.cafeProfile}
          </MenuItem>
          <MenuItem onSelect={() => router.push("/settings/billing")}>
            <CreditCard className="size-4 text-muted-foreground" /> {d.nav.billing}
          </MenuItem>
        </>
      )}
      <MenuItem onSelect={() => router.push("/settings/notifications")}>
        <BellRing className="size-4 text-muted-foreground" /> {d.nav.notifications}
      </MenuItem>
      <MenuItem onSelect={() => router.push("/settings/city")}>
        <MapPin className="size-4 text-muted-foreground" /> {cityName ?? d.nav.setYourCity}
      </MenuItem>
      <MenuItem
        onSelect={async () => {
          await setLocale(locale === "fr" ? "en" : "fr");
          router.refresh();
        }}
      >
        <Languages className="size-4 text-muted-foreground" /> {d.nav.language}
      </MenuItem>
      <MenuItem onSelect={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
        {resolvedTheme === "dark" ? (
          <Sun className="size-4 text-muted-foreground" />
        ) : (
          <Moon className="size-4 text-muted-foreground" />
        )}
        {resolvedTheme === "dark" ? d.nav.lightMode : d.nav.darkMode}
      </MenuItem>
      <MenuSeparator />
      <MenuItem destructive onSelect={() => signOut()}>
        <LogOut className="size-4" /> {d.common.logOut}
      </MenuItem>
    </Menu>
  );
}
