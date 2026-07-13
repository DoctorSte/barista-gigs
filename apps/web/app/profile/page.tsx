import { SKILLS } from "@barista-gigs/shared";
import { PageShell } from "@/components/page-shell";
import { updateExtraProfileAction } from "@/app/actions/profile";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function ExtraProfilePage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const { data: extra } = await supabase
    .from("extras_profiles")
    .select("*")
    .eq("user_id", profile?.id ?? "")
    .maybeSingle();

  return (
    <PageShell title="Your profile" description="Experience, rates, availability, and portfolio.">
      <form action={updateExtraProfileAction} className="max-w-2xl space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="bio">
            Bio
          </label>
          <textarea id="bio" name="bio" rows={4} defaultValue={extra?.bio ?? ""} className="w-full rounded-lg border border-stone-300 px-3 py-2" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="yearsExperience">
              Years of experience
            </label>
            <input id="yearsExperience" name="yearsExperience" type="number" defaultValue={extra?.years_experience ?? ""} className="w-full rounded-lg border border-stone-300 px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="hourlyRateCents">
              Hourly rate (cents)
            </label>
            <input id="hourlyRateCents" name="hourlyRateCents" type="number" defaultValue={extra?.hourly_rate_cents ?? ""} className="w-full rounded-lg border border-stone-300 px-3 py-2" />
          </div>
        </div>
        <input
          type="hidden"
          name="availability"
          value={JSON.stringify(extra?.availability ?? { weekly: [], blackoutDates: [] })}
        />
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Skills</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {SKILLS.map((skill) => (
              <label key={skill} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="skills"
                  value={skill}
                  defaultChecked={extra?.skills?.includes(skill)}
                />
                {skill.replaceAll("_", " ")}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isAvailable" defaultChecked={extra?.is_available ?? true} />
          Available for gigs
        </label>
        <button type="submit" className="rounded-full bg-stone-900 px-4 py-2 text-white">
          Save profile
        </button>
      </form>
    </PageShell>
  );
}
