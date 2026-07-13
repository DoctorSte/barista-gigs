import { SKILLS } from "@barista-gigs/shared";
import { createAnnouncementAction } from "@/app/actions/profile";
import { getRecommendedBaristas } from "@/lib/recommendations";
import { formatMoney } from "@/lib/utils";

export async function AnnouncementForm({
  cityId,
  defaultStartsAt,
  defaultEndsAt,
}: {
  cityId: string;
  defaultStartsAt: string;
  defaultEndsAt: string;
}) {
  const recommended = await getRecommendedBaristas({
    cityId,
    startsAt: defaultStartsAt,
    endsAt: defaultEndsAt,
    requiredSkills: [],
  });

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
      <form action={createAnnouncementAction} className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="title">
            Title
          </label>
          <input id="title" name="title" required className="w-full rounded-lg border border-stone-300 px-3 py-2" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="description">
            Description
          </label>
          <textarea id="description" name="description" rows={5} required className="w-full rounded-lg border border-stone-300 px-3 py-2" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="startsAt">
              Starts at
            </label>
            <input id="startsAt" name="startsAt" type="datetime-local" defaultValue={defaultStartsAt.slice(0, 16)} required className="w-full rounded-lg border border-stone-300 px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="endsAt">
              Ends at
            </label>
            <input id="endsAt" name="endsAt" type="datetime-local" defaultValue={defaultEndsAt.slice(0, 16)} required className="w-full rounded-lg border border-stone-300 px-3 py-2" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="payRateCents">
              Pay (cents)
            </label>
            <input id="payRateCents" name="payRateCents" type="number" min={0} required className="w-full rounded-lg border border-stone-300 px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="payType">
              Pay type
            </label>
            <select id="payType" name="payType" className="w-full rounded-lg border border-stone-300 px-3 py-2">
              <option value="hourly">Hourly</option>
              <option value="flat">Flat</option>
            </select>
          </div>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Required skills</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {SKILLS.map((skill) => (
              <label key={skill} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="requiredSkills" value={skill} />
                {skill.replaceAll("_", " ")}
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="status">
            Status
          </label>
          <select id="status" name="status" className="w-full rounded-lg border border-stone-300 px-3 py-2">
            <option value="open">Publish now</option>
            <option value="draft">Save draft</option>
          </select>
        </div>
        <button type="submit" className="rounded-full bg-stone-900 px-4 py-2 text-white">
          Post announcement
        </button>
      </form>

      <aside className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Recommended baristas</h2>
        <p className="mt-1 text-sm text-stone-600">
          Based on availability and profile completeness in your city.
        </p>
        <ul className="mt-4 space-y-3">
          {recommended.length === 0 ? (
            <li className="text-sm text-stone-500">No matches yet for these dates.</li>
          ) : (
            recommended.map((extra) => (
              <li key={extra.id} className="rounded-xl border border-stone-100 p-3">
                <p className="font-medium">{extra.displayName}</p>
                <p className="text-sm text-stone-600">
                  {extra.years_experience ?? 0} yrs ·{" "}
                  {extra.hourly_rate_cents
                    ? formatMoney(extra.hourly_rate_cents, extra.currency)
                    : "Rate not set"}
                  /hr
                </p>
                <p className="mt-1 text-xs uppercase tracking-wide text-stone-500">
                  {extra.skills.slice(0, 3).join(", ")}
                </p>
              </li>
            ))
          )}
        </ul>
      </aside>
    </div>
  );
}
