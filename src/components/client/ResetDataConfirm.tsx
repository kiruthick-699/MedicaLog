"use client";

import { useFormStatus } from "react-dom";

export default function ResetDataConfirm({
  action,
}: {
  action: (formData: FormData) => Promise<void>;
}) {
  const { pending } = useFormStatus();

  return (
    <form action={action} className="flex items-center gap-4">
      <button
        type="submit"
        disabled={pending}
        className="px-4 py-2 border border-black rounded-md bg-black text-white disabled:opacity-50"
      >
        {pending ? "Resetting…" : "Confirm reset"}
      </button>
      <a
        href="/settings"
        className="px-4 py-2 border border-black/30 rounded-md text-black/70 hover:text-black"
      >
        Cancel
      </a>
    </form>
  );
}
