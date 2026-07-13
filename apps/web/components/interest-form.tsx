import { expressInterestAction } from "@/app/actions/profile";

export function InterestForm({ announcementId }: { announcementId: string }) {
  return (
    <form action={expressInterestAction} className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <input type="hidden" name="announcementId" value={announcementId} />
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="message">
          Message to the shop
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          required
          placeholder="Introduce yourself and confirm your availability..."
          className="w-full rounded-lg border border-stone-300 px-3 py-2"
        />
      </div>
      <button type="submit" className="rounded-full bg-stone-900 px-4 py-2 text-white">
        Express interest
      </button>
    </form>
  );
}
