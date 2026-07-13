"use client";

export function SubscribeButton() {
  async function handleSubscribe() {
    const response = await fetch("/api/stripe/checkout", { method: "POST" });
    const data = await response.json();
    if (data.url) {
      window.location.href = data.url;
    }
  }

  return (
    <button
      type="button"
      onClick={handleSubscribe}
      className="rounded-full bg-stone-900 px-5 py-2.5 text-white hover:bg-stone-800"
    >
      Subscribe for $30/mo
    </button>
  );
}
