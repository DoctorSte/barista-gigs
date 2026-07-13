import Link from "next/link";
import type { City } from "@barista-gigs/shared";
import { USER_ROLES } from "@barista-gigs/shared";
import { signUpAction } from "@/app/actions/profile";

export function SignupForm({
  cities,
  defaultCitySlug,
}: {
  cities: City[];
  defaultCitySlug: string;
}) {
  return (
    <form action={signUpAction} className="mx-auto max-w-md space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="displayName">
          Display name
        </label>
        <input
          id="displayName"
          name="displayName"
          required
          className="w-full rounded-lg border border-stone-300 px-3 py-2"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded-lg border border-stone-300 px-3 py-2"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          minLength={8}
          required
          className="w-full rounded-lg border border-stone-300 px-3 py-2"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="role">
          Account type
        </label>
        <select id="role" name="role" className="w-full rounded-lg border border-stone-300 px-3 py-2">
          {USER_ROLES.map((role) => (
            <option key={role} value={role}>
              {role === "shop" ? "Coffee shop" : "Extra (barista)"}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="citySlug">
          City
        </label>
        <select
          id="citySlug"
          name="citySlug"
          defaultValue={defaultCitySlug}
          className="w-full rounded-lg border border-stone-300 px-3 py-2"
        >
          {cities.map((city) => (
            <option key={city.id} value={city.slug}>
              {city.name}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="w-full rounded-full bg-stone-900 px-4 py-2 text-white hover:bg-stone-800"
      >
        Create account
      </button>
      <p className="text-center text-sm text-stone-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-stone-900 underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
