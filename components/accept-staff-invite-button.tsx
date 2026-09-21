"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { acceptStaffInvite } from "@/app/actions/staff";
import { useDict } from "@/components/i18n-provider";

export function AcceptStaffInviteButton({ token, label }: { token: string; label: string }) {
  const d = useDict();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function accept() {
    startTransition(async () => {
      const result = await acceptStaffInvite(token);
      if (result.ok) {
        toast.success(d.schedule.join.accepted);
        router.push("/schedule");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={accept}
      className="pressable inline-flex h-11 items-center rounded-md bg-accent px-6 text-sm font-medium text-accent-foreground disabled:opacity-60"
    >
      {pending ? d.common.loading : label}
    </button>
  );
}
