// Internal heads-up emails to whoever runs Barista Gigs (ADMIN_EMAIL): a new
// café joining, a gig going up. Best-effort like every other email — no
// address configured means no-op, and a failed send never breaks the action.
import { sendEmails } from "@/lib/email";
import { appUrl } from "@/lib/stripe";

type AdminAlert = {
  subject: string;
  title: string;
  body?: string;
  lines?: string[];
  /** App-relative path, e.g. `/gigs/123`. */
  path?: string;
};

export async function alertAdmin(alert: AdminAlert): Promise<void> {
  const to = process.env.ADMIN_EMAIL;
  if (!to) return;
  await sendEmails([
    {
      to,
      subject: `[Barista Gigs] ${alert.subject}`,
      title: alert.title,
      body: alert.body,
      lines: alert.lines,
      ctaLabel: alert.path ? "Open in Barista Gigs" : undefined,
      ctaUrl: alert.path ? appUrl(alert.path) : undefined,
      footer: "Internal alert — sent to ADMIN_EMAIL whenever a café joins or posts a gig.",
    },
  ]);
}
