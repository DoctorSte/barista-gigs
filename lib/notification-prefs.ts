import type { NotificationPrefs } from "@/lib/database.types";

/** Toggleable email categories; each notification type maps into one. */
export type EmailPrefKey =
  | "email_applications"
  | "email_messages"
  | "email_opportunities"
  | "email_team"
  | "email_referrals"
  | "email_digest";

export const EMAIL_PREF_KEYS: EmailPrefKey[] = [
  "email_applications",
  "email_messages",
  "email_opportunities",
  "email_team",
  "email_referrals",
  "email_digest",
];

const CATEGORY_BY_TYPE: Record<string, EmailPrefKey> = {
  new_applicant: "email_applications",
  application_accepted: "email_applications",
  application_declined: "email_applications",
  new_message: "email_messages",
  gig_invite: "email_opportunities",
  sos_gig: "email_opportunities",
  team_invite: "email_team",
  team_joined: "email_team",
  referral_reward: "email_referrals",
  shift_completed: "email_applications",
  new_review: "email_applications",
};

/** No stored row means everything on. */
export function emailAllowed(
  prefs: Pick<NotificationPrefs, EmailPrefKey> | null | undefined,
  type: string,
): boolean {
  if (!prefs) return true;
  const key = CATEGORY_BY_TYPE[type];
  return key ? prefs[key] : true;
}
