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
      try {
        const result = await editMedicationNameAction({ medicationId, name });
        if (!result.ok) {
          setErrors(result.errors ?? ["Unable to save changes"]);
        }
      } catch (err: any) {
        if (err?.digest?.includes('NEXT_REDIRECT') || err?.message?.includes('NEXT_REDIRECT')) {
          return;
        }
        setErrors(["An unexpected error occurred"]);
      }
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
          disabled={isPending}
          className="w-full border border-black/20 bg-white px-3 py-2 text-sm text-black rounded-md"
        />
      </div>

      {errors.length > 0 && (
        <div className="border border-red-200 bg-red-50 p-3 rounded-lg" role="alert" aria-live="polite">
          <ul className="text-sm text-red-700 space-y-1">
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
          className="border border-black px-4 py-2 text-sm font-medium bg-black text-white rounded-md hover:bg-black/90 disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Save changes'}
        </button>
        <a href={`/medications/${medicationId}`} className="text-sm underline">Cancel</a>
      </div>
    </form>
  );
}
