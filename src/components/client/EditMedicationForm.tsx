"use client";

import { useState, useTransition } from "react";
import { editMedicationNameAction } from "@/lib/actions/medications";

export function EditMedicationForm({ medicationId, initialName }: { medicationId: string; initialName: string }) {
  const [name, setName] = useState(initialName);
  const [errors, setErrors] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    startTransition(async () => {
      const result = await editMedicationNameAction({ medicationId, name });
      if (!result.ok) {
        setErrors(result.errors ?? ["Unable to save changes"]);
      }
      // On success, server action redirects to the details page
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="name" className="text-sm font-medium text-black">Medication name</label>
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
        <button type="submit" disabled={isPending} className="border border-black px-3 py-2 text-sm font-medium">
          Save changes
        </button>
        <a href={`/medications/${medicationId}`} className="text-sm underline">Cancel</a>
      </div>
    </form>
  );
}
