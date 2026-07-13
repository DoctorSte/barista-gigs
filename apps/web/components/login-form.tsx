import Link from "next/link";
import { signInAction } from "@/app/actions/profile";

export function LoginForm({ next }: { next?: string }) {
  return (
    <form action={signInAction} className="mx-auto max-w-md space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <input type="hidden" name="next" value={next ?? "/gigs"} />
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
          required
          className="w-full rounded-lg border border-stone-300 px-3 py-2"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-full bg-stone-900 px-4 py-2 text-white hover:bg-stone-800"
      >
        Log in
      </button>
      <p className="text-center text-sm text-stone-600">
        No account?{" "}
        <Link href="/signup" className="font-medium text-stone-900 underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
