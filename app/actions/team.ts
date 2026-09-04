"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { getOwnerShops, getOwnerSubscription, getSession, requireShop } from "@/lib/auth";
import { notify } from "@/lib/notifications";
import { sendEmails } from "@/lib/email";
import { PLANS, isPlanId } from "@/lib/plans";
import { emailSchema, type ActionResult } from "@/lib/validation";

async function requireOwner() {
  const { user, shop } = await requireShop();
  const shops = await getOwnerShops();
  const primary = shops[0] ?? shop;
  if (primary.owner_id !== user.id) return null;
  return { user, primary };
}

export async function inviteMember(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const owner = await requireOwner();
  if (!owner) return { ok: false, error: "Only the account owner can manage the team." };

  const parsed = emailSchema.safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!parsed.success) return { ok: false, error: "Enter a valid email address", field: "email" };
  const email = parsed.data;

  const subscription = await getOwnerSubscription();
  if (subscription?.status !== "active") {
    return { ok: false, error: "Activate your subscription before inviting teammates." };
  }
  const plan = PLANS[isPlanId(subscription.plan) ? subscription.plan : "regular"];
  const supabase = await createClient();

  const [{ count: memberCount }, { count: pendingCount }] = await Promise.all([
    supabase
      .from("cafe_members")
      .select("member_id", { count: "exact", head: true })
      .eq("owner_id", owner.user.id),
    supabase
      .from("cafe_invites")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", owner.user.id)
      .is("accepted_at", null),
  ]);
  // The owner takes one seat; members and open invites take the rest.
  if (1 + (memberCount ?? 0) + (pendingCount ?? 0) >= plan.teamAccounts) {
    return {
      ok: false,
      error:
        plan.teamAccounts === 1
          ? `The ${plan.name} plan has a single account — upgrade for team seats.`
          : `All ${plan.teamAccounts} team seats on the ${plan.name} plan are taken.`,
    };
  }

  const { data: invite, error } = await supabase
    .from("cafe_invites")
    .insert({ owner_id: owner.user.id, email })
    .select("token")
    .single();
  if (error || !invite) return { ok: false, error: "Could not create the invite. Try again." };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://baristagigs.com";
  const joinUrl = `${appUrl}/team/join/${invite.token}`;

  // Email the invitee; if they already have an account, ping in-app too.
  await sendEmails([
    {
      to: email,
      subject: `Join ${owner.primary.name} on Barista Gigs`,
      title: `${owner.primary.name} invited you to their café team`,
      body: "You'll share the café workspace: gigs, applicants, and messages.",
      ctaLabel: "Accept the invite",
      ctaUrl: joinUrl,
    },
  ]);
  if (hasAdminClient()) {
    try {
      const admin = createAdminClient();
      const { data: users } = await admin.auth.admin.listUsers({ perPage: 1000 });
      const existing = users?.users.find((u) => u.email?.toLowerCase() === email);
      if (existing) {
        await notify(existing.id, {
          type: "team_invite",
          title: `${owner.primary.name} invited you to their café team`,
          href: `/team/join/${invite.token}`,
        });
      }
    } catch {
      // best-effort
    }
  }

  revalidatePath("/cafe/dashboard");
  return { ok: true };
}

export async function removeMember(memberId: string): Promise<ActionResult> {
  const owner = await requireOwner();
  if (!owner) return { ok: false, error: "Only the account owner can manage the team." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("cafe_members")
    .delete()
    .eq("owner_id", owner.user.id)
    .eq("member_id", memberId);
  if (error) return { ok: false, error: "Could not remove the team member." };
  revalidatePath("/cafe/dashboard");
  return { ok: true };
}

export async function revokeInvite(inviteId: string): Promise<ActionResult> {
  const owner = await requireOwner();
  if (!owner) return { ok: false, error: "Only the account owner can manage the team." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("cafe_invites")
    .delete()
    .eq("id", inviteId)
    .eq("owner_id", owner.user.id)
    .is("accepted_at", null);
  if (error) return { ok: false, error: "Could not revoke the invite." };
  revalidatePath("/cafe/dashboard");
  return { ok: true };
}

export async function acceptInvite(token: string): Promise<ActionResult> {
  const { user } = await getSession();
  if (!user) return { ok: false, error: "Log in first." };
  if (!hasAdminClient()) return { ok: false, error: "Invites aren't available right now." };
  const admin = createAdminClient();

  const { data: invite } = await admin
    .from("cafe_invites")
    .select("id, owner_id, accepted_at")
    .eq("token", token)
    .maybeSingle();
  if (!invite) return { ok: false, error: "This invite link isn't valid." };
  if (invite.accepted_at) return { ok: false, error: "This invite was already used." };
  if (invite.owner_id === user.id) {
    return { ok: false, error: "You can't join your own team." };
  }

  // A barista account can't double as a café team account.
  const { data: extra } = await admin
    .from("extras_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (extra) {
    return {
      ok: false,
      error: "This account is a barista account — create a separate account for café work.",
    };
  }
  const { count: ownShops } = await admin
    .from("coffee_shops")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id);
  if ((ownShops ?? 0) > 0) {
    return { ok: false, error: "This account already owns a café." };
  }

  // Ensure a shop-role profile exists (invitees may never pass onboarding),
  // without clobbering one that's already set up.
  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();
  if (!existingProfile) {
    const { data: ownerProfile } = await admin
      .from("profiles")
      .select("city_id")
      .eq("id", invite.owner_id)
      .single();
    if (!ownerProfile) return { ok: false, error: "Could not join the team. Try again." };
    await admin.from("profiles").insert({
      id: user.id,
      role: "shop",
      display_name:
        (user.user_metadata?.display_name as string | undefined) ??
        user.email?.split("@")[0] ??
        "Team member",
      city_id: ownerProfile.city_id,
    });
  } else if (existingProfile.role !== "shop") {
    await admin.from("profiles").update({ role: "shop" }).eq("id", user.id);
  }

  const { error } = await admin
    .from("cafe_members")
    .upsert({ owner_id: invite.owner_id, member_id: user.id });
  if (error) return { ok: false, error: "Could not join the team. Try again." };

  await admin
    .from("cafe_invites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);
  await notify(invite.owner_id, {
    type: "team_joined",
    title: `${user.email ?? "A new member"} joined your café team`,
    href: "/cafe/dashboard",
  });

  revalidatePath("/", "layout");
  redirect("/cafe/dashboard");
}
