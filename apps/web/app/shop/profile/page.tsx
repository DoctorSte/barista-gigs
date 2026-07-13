import { MACHINES } from "@barista-gigs/shared";
import { PageShell } from "@/components/page-shell";
import { updateShopProfileAction } from "@/app/actions/profile";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function ShopProfilePage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const { data: shop } = await supabase
    .from("coffee_shops")
    .select("*")
    .eq("owner_id", profile?.id ?? "")
    .maybeSingle();

  return (
    <PageShell title="Shop profile" description="Address, machines, and details visible to baristas.">
      <form action={updateShopProfileAction} className="max-w-2xl space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="name">
            Shop name
          </label>
          <input id="name" name="name" defaultValue={shop?.name ?? ""} required className="w-full rounded-lg border border-stone-300 px-3 py-2" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="address">
            Address
          </label>
          <input id="address" name="address" defaultValue={shop?.address ?? ""} required className="w-full rounded-lg border border-stone-300 px-3 py-2" />
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Machines</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {MACHINES.map((machine) => (
              <label key={machine} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="machines"
                  value={machine}
                  defaultChecked={shop?.machines?.includes(machine)}
                />
                {machine}
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="description">
            Description
          </label>
          <textarea id="description" name="description" rows={4} defaultValue={shop?.description ?? ""} className="w-full rounded-lg border border-stone-300 px-3 py-2" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isPublished" defaultChecked={shop?.is_published ?? false} />
          Published in city
        </label>
        <button type="submit" className="rounded-full bg-stone-900 px-4 py-2 text-white">
          Save profile
        </button>
      </form>
    </PageShell>
  );
}
