export const CITY_COOKIE = "barista_gigs_city";

export const USER_ROLES = ["shop", "extra"] as const;

export const ANNOUNCEMENT_STATUSES = [
  "draft",
  "open",
  "filled",
  "closed",
] as const;

export const INTEREST_STATUSES = ["pending", "accepted", "declined"] as const;

export const PAY_TYPES = ["hourly", "flat"] as const;

export const SKILLS = [
  "latte_art",
  "batch_brew",
  "service",
  "espresso",
  "filter",
  "management",
] as const;

export const MACHINES = [
  "La Marzocco Linea",
  "La Marzocco KB90",
  "Victoria Arduino Black Eagle",
  "Slayer",
  "Synesso",
  "EK43",
  "Mythos",
  "Fellow Ode",
] as const;

export const SHOP_SUBSCRIPTION_PRICE_LABEL = "$30/mo";
