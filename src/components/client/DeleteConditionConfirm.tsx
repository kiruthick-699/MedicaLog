"use client";

import { useFormStatus } from "react-dom";

export default function DeleteConditionConfirm({
  action,
  conditionId,
}: {
  action: (formData: FormData) => Promise<void>;
  conditionId: string;
}) {
  const { pending } = useFormStatus();

  return (
    <form action={action} className="flex items-center gap-4">
      <input type="hidden" name="conditionId" value={conditionId} />
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
