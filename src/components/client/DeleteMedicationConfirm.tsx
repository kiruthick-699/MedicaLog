"use client";

import { useTransition } from "react";

function SubmitButton({ pending }: { pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 border border-black rounded-md bg-black text-white hover:bg-black/90 disabled:opacity-50"
    >
      {pending ? "Deleting…" : "Confirm delete"}
    </button>
  );
}

export default function DeleteMedicationConfirm({
  action,
  medicationId,
}: {
  action: (formData: FormData) => Promise<void>;
  medicationId: string;
}) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await action(formData);
      } catch (err: any) {
        if (!err?.digest?.includes('NEXT_REDIRECT') && !err?.message?.includes('NEXT_REDIRECT')) {
          console.error('Delete failed:', err);
        }
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-4">
      <input type="hidden" name="medicationId" value={medicationId} />
      <SubmitButton pending={isPending} />
    </form>
  );
}
