import { MACHINES, SKILLS } from "@barista-gigs/shared";
import { completeOnboardingAction } from "@/app/actions/profile";

export function OnboardingForm({ role }: { role: "shop" | "extra" }) {
  if (role === "shop") {
    return (
      <form action={completeOnboardingAction} className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="name">
            Shop name
          </label>
          <input id="name" name="name" required className="w-full rounded-lg border border-stone-300 px-3 py-2" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="address">
            Address
          </label>
          <input id="address" name="address" required className="w-full rounded-lg border border-stone-300 px-3 py-2" />
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Machines</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {MACHINES.map((machine) => (
              <label key={machine} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="machines" value={machine} />
                {machine}
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="description">
            About the shop
          </label>
          <textarea id="description" name="description" rows={4} className="w-full rounded-lg border border-stone-300 px-3 py-2" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isPublished" defaultChecked />
          Publish shop profile in this city
        </label>
        <button type="submit" className="rounded-full bg-stone-900 px-4 py-2 text-white">
          Finish setup
        </button>
      </form>
    );
  }

  return (
    <form action={completeOnboardingAction} className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="bio">
          Bio
        </label>
        <textarea id="bio" name="bio" rows={4} className="w-full rounded-lg border border-stone-300 px-3 py-2" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="yearsExperience">
            Years of experience
          </label>
          <input id="yearsExperience" name="yearsExperience" type="number" min={0} className="w-full rounded-lg border border-stone-300 px-3 py-2" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="hourlyRateCents">
            Hourly rate (cents)
          </label>
          <input id="hourlyRateCents" name="hourlyRateCents" type="number" min={0} placeholder="2500" className="w-full rounded-lg border border-stone-300 px-3 py-2" />
        </div>
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Skills</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {SKILLS.map((skill) => (
            <label key={skill} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="skills" value={skill} />
              {skill.replaceAll("_", " ")}
            </label>
          ))}
        </div>
      </fieldset>
      <button type="submit" className="rounded-full bg-stone-900 px-4 py-2 text-white">
        Finish setup
      </button>
    </form>
  );
}
