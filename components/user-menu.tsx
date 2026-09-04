"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  BellRing,
  CreditCard,
  LogOut,
  MapPin,
  Moon,
  Store,
  Sun,
  UserRound,
} from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { Avatar } from "@/components/ui/avatar";
import { Menu, MenuItem, MenuLabel, MenuSeparator } from "@/components/ui/menu";

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

  return (
    <Menu trigger={() => <Avatar name={name} src={avatarUrl} />}>
      <MenuLabel>
        <span className="block truncate font-medium text-foreground">{name}</span>
        <span className="block truncate">{email}</span>
      </MenuLabel>
      <MenuSeparator />
      {role === "extra" ? (
        <MenuItem onSelect={() => router.push("/profile")}>
          <UserRound className="size-4 text-muted-foreground" /> My profile
        </MenuItem>
      ) : (
        <>
          <MenuItem onSelect={() => router.push("/cafe/profile")}>
            <Store className="size-4 text-muted-foreground" /> Café profile
          </MenuItem>
          <MenuItem onSelect={() => router.push("/settings/billing")}>
            <CreditCard className="size-4 text-muted-foreground" /> Billing
          </MenuItem>
        </>
      )}
      <MenuItem onSelect={() => router.push("/settings/notifications")}>
        <BellRing className="size-4 text-muted-foreground" /> Notifications
      </MenuItem>
      <MenuItem onSelect={() => router.push("/settings/city")}>
        <MapPin className="size-4 text-muted-foreground" /> {cityName ?? "Set your city"}
      </MenuItem>
      <MenuItem onSelect={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
        {resolvedTheme === "dark" ? (
          <Sun className="size-4 text-muted-foreground" />
        ) : (
          <Moon className="size-4 text-muted-foreground" />
        )}
        {resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
      </MenuItem>
      <MenuSeparator />
      <MenuItem destructive onSelect={() => signOut()}>
        <LogOut className="size-4" /> Log out
      </MenuItem>
    </Menu>
  );
}
