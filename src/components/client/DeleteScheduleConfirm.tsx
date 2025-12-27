"use client";

import { useFormStatus } from "react-dom";

export default function DeleteScheduleConfirm({
  action,
  medicationId,
  scheduleId,
}: {
  action: (formData: FormData) => Promise<void>;
  medicationId: string;
  scheduleId: string;
}) {
  const { pending } = useFormStatus();

  return (
    <form action={action} className="flex items-center gap-4">
      <input type="hidden" name="medicationId" value={medicationId} />
      <input type="hidden" name="scheduleId" value={scheduleId} />
      <button
        type="submit"
        disabled={pending}
        className="px-4 py-2 border border-black rounded-md bg-black text-white disabled:opacity-50"
      >
        {pending ? "Deleting…" : "Confirm delete"}
      </button>
    </form>
  );
}
