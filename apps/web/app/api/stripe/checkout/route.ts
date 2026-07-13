import Stripe from "stripe";
import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { getAppUrl } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export async function POST() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "shop") {
    return NextResponse.json({ error: "Shop account required" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: shop } = await supabase
    .from("coffee_shops")
    .select("id, name")
    .eq("owner_id", profile.id)
    .maybeSingle();

  if (!shop) {
    return NextResponse.json({ error: "Shop profile required" }, { status: 400 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const priceId = process.env.STRIPE_PRICE_ID_SHOP_MONTHLY;
  if (!priceId) {
    return NextResponse.json({ error: "Stripe price not configured" }, { status: 500 });
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("shop_id", shop.id)
    .maybeSingle();

  let customerId = subscription?.stripe_customer_id ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      metadata: { shop_id: shop.id, owner_id: profile.id },
      name: shop.name,
    });
    customerId = customer.id;
    await supabase.from("subscriptions").upsert({
      shop_id: shop.id,
      stripe_customer_id: customerId,
      status: "inactive",
      updated_at: new Date().toISOString(),
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${getAppUrl()}/settings/billing?success=1`,
    cancel_url: `${getAppUrl()}/settings/billing?canceled=1`,
    metadata: { shop_id: shop.id },
  });

  return NextResponse.json({ url: session.url });
}
