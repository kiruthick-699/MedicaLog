"use client";

import { useState, useTransition } from "react";
import { addMedicationScheduleAction } from "@/lib/actions/medications";
import { TimeSlot } from "@/lib/validation/inputSchemas";

const TIME_SLOTS: TimeSlot[] = ["MORNING", "AFTERNOON", "EVENING", "NIGHT"];

export function AddScheduleForm({ medicationId }: { medicationId: string }) {
  const [timeSlot, setTimeSlot] = useState<TimeSlot>("MORNING");
  const [frequency, setFrequency] = useState("");
  const [timing, setTiming] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    startTransition(async () => {
      const result = await addMedicationScheduleAction({
        medicationId,
        timeSlot,
        frequency,
        timing,
        note,
      });

      if (!result.ok) {
        setErrors(result.errors ?? ["Unable to add schedule"]);
      }
      // Success path redirects server-side back to medication detail
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="timeSlot" className="text-sm font-medium text-black">Time slot</label>
        <select
          id="timeSlot"
          name="timeSlot"
          value={timeSlot}
          onChange={(e) => setTimeSlot(e.target.value as TimeSlot)}
          required
          className="w-full border border-black/20 bg-white px-3 py-2 text-sm text-black"
        >
          {TIME_SLOTS.map((slot) => (
            <option key={slot} value={slot}>{slot.charAt(0) + slot.slice(1).toLowerCase()}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="frequency" className="text-sm font-medium text-black">Frequency</label>
        <input
          id="frequency"
          name="frequency"
          type="text"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          required
          className="w-full border border-black/20 bg-white px-3 py-2 text-sm text-black"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="timing" className="text-sm font-medium text-black">Timing</label>
        <input
          id="timing"
          name="timing"
          type="text"
          value={timing}
          onChange={(e) => setTiming(e.target.value)}
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
          className="border border-black px-4 py-2 bg-black text-white text-sm font-medium disabled:opacity-60"
        >
          {isPending ? "Adding…" : "Add schedule"}
        </button>
        <a href={`/medications/${medicationId}`} className="text-sm underline">Cancel</a>
      </div>
    </form>
  );
}
