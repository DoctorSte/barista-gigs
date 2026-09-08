import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  // Best-effort validation: café codes resolve via the anon-readable published
  // shops; barista codes need the service role (profiles aren't anon-readable).
  // If the code doesn't resolve we still send the visitor to signup — just
  // without the referral cookie.
  let valid = false;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("coffee_shops")
      .select("id")
      .eq("referral_code", code)
      .maybeSingle();
    valid = Boolean(data);
    if (!valid && hasAdminClient()) {
      const { data: extra } = await createAdminClient()
        .from("extras_profiles")
        .select("id")
        .eq("referral_code", code)
        .maybeSingle();
      valid = Boolean(extra);
    }
  } catch {
    valid = false;
  }

  const response = NextResponse.redirect(new URL("/signup", request.url));
  if (valid) {
    response.cookies.set("referral_code", code, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      sameSite: "lax",
    });
  }
  return response;
}
