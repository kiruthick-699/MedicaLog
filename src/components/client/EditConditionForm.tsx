"use client";

import { useState, useTransition } from "react";
import { editConditionAction } from "@/lib/actions/conditions";

export function EditConditionForm({
  conditionId,
  initialName,
  initialNote,
}: {
  conditionId: string;
  initialName: string;
  initialNote?: string | null;
}) {
  const [name, setName] = useState(initialName);
  const [note, setNote] = useState(initialNote || "");
  const [errors, setErrors] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    startTransition(async () => {
      const result = await editConditionAction({ conditionId, name, note });
      if (!result.ok) {
        setErrors(result.errors ?? ["Unable to save changes"]);
      }
      // Success path redirects server-side to /conditions
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-black">Condition name</label>
        <input
          id="name"
          name="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full border border-black/20 bg-white px-3 py-2 text-sm text-black"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="note" className="text-sm font-medium text-black">Note (optional)</label>
        <textarea
          id="note"
          name="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full border border-black/20 bg-white px-3 py-2 text-sm text-black min-h-[96px]"
        />
      </div>

      {errors.length > 0 && (
        <div className="border border-black/20 bg-white p-3" role="alert" aria-live="polite">
          <ul className="text-sm text-black/80 space-y-1">
            {errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="border border-black px-3 py-2 text-sm font-medium disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
        <a href="/conditions" className="text-sm underline">Cancel</a>
      </div>
    </form>
  );
}
