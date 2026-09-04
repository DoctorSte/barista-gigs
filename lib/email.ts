// Server-only transactional email via Resend's HTTP API. Best-effort: a
// missing key or failed send never breaks the action that triggered it.
// Swap providers by reimplementing sendEmails() — nothing else knows Resend.

const FROM = process.env.EMAIL_FROM ?? "Barista Gigs <notifications@baristagigs.com>";

export type EmailInput = {
  to: string;
  subject: string;
  title: string;
  body?: string;
  /** Optional item list rendered under the body (digest emails). */
  lines?: string[];
  ctaLabel?: string;
  ctaUrl?: string; // absolute URL
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function render(input: EmailInput) {
  const button = input.ctaUrl
    ? `<a href="${input.ctaUrl}" style="display:inline-block;margin-top:20px;padding:11px 22px;border-radius:8px;background:#7c5231;color:#ffffff;text-decoration:none;font-weight:600">${input.ctaLabel ?? "Open Barista Gigs"}</a>`
    : "";
  return `<!doctype html>
<html><body style="margin:0;background:#f6f3ef;padding:32px 16px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;padding:32px">
      <tr><td>
        <p style="margin:0 0 24px;font-size:15px;font-weight:700;color:#7c5231">Barista Gigs</p>
        <h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;color:#221c15">${input.title}</h1>
        ${input.body ? `<p style="margin:0;font-size:15px;line-height:1.6;color:#5c5347">${input.body}</p>` : ""}
        ${
          input.lines?.length
            ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px">${input.lines
                .map(
                  (line) =>
                    `<tr><td style="padding:9px 0;border-top:1px solid #efe8dc;font-size:14px;line-height:1.5;color:#3d3526">${escapeHtml(line)}</td></tr>`,
                )
                .join("")}</table>`
            : ""
        }
        ${button}
        <p style="margin:28px 0 0;font-size:12px;color:#a39a8c">You're receiving this because you have a Barista Gigs account. Manage notifications in the app.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

/** Send up to 100 emails in one Resend batch call. No-op without RESEND_API_KEY. */
export async function sendEmails(inputs: EmailInput[]): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key || inputs.length === 0) return;

  try {
    await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(
        inputs.slice(0, 100).map((input) => ({
          from: FROM,
          to: [input.to],
          subject: input.subject,
          html: render(input),
        })),
      ),
    });
  } catch {
    // Email is best-effort.
  }
}
