import Link from "next/link";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import { getCities, getSelectedCitySlug } from "@/lib/city";
import { CitySelector } from "@/components/city-selector";
import { signOutAction } from "@/app/actions/auth";

export async function SiteHeader() {
  const [user, profile, cities, citySlug] = await Promise.all([
    getCurrentUser(),
    getCurrentProfile(),
    getCities(),
    getSelectedCitySlug(),
  ]);

  return (
    <header className="border-b border-stone-200 bg-[#f8f4ef]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold tracking-tight text-stone-900">
            Barista Gigs
          </Link>
          <CitySelector cities={cities} selectedSlug={citySlug} />
        </div>
        <nav className="flex items-center gap-4 text-sm text-stone-700">
          <Link href="/gigs" className="hover:text-stone-900">
            Gigs
          </Link>
          {profile?.role === "shop" && (
            <>
              <Link href="/shop/dashboard" className="hover:text-stone-900">
                Dashboard
              </Link>
              <Link href="/shop/announce/new" className="hover:text-stone-900">
                Post gig
              </Link>
            </>
          )}
          {profile?.role === "extra" && (
            <Link href="/profile" className="hover:text-stone-900">
              Profile
            </Link>
          )}
          {user && (
            <Link href="/messages" className="hover:text-stone-900">
              Messages
            </Link>
          )}
          {user ? (
            <form action={signOutAction}>
              <button type="submit" className="hover:text-stone-900">
                Sign out
              </button>
            </form>
          ) : (
            <>
              <Link href="/login" className="hover:text-stone-900">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-stone-900 px-4 py-2 text-white hover:bg-stone-800"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
