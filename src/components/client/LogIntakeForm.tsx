"use client";

import { useState, useTransition } from "react";
import { logMedicationIntakeAction } from "@/lib/actions/medications";

export default function LogIntakeForm(props: {
  medicationId: string;
  scheduleId: string;
}) {
  const { medicationId, scheduleId } = props;
  const [status, setStatus] = useState<"TAKEN" | "MISSED" | null>(null);
  const [observation, setObservation] = useState<string>("");
  const [pending, startTransition] = useTransition();

  const submit = () => {
    if (!status || pending) return;
    startTransition(async () => {
      await logMedicationIntakeAction({
        medicationId,
        scheduleId,
        status,
        observation: observation?.trim() || undefined,
        redirectTo: `/medications/${medicationId}?intakeLogged=1`,
      });
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="status"
            value="TAKEN"
            checked={status === "TAKEN"}
            onChange={() => setStatus("TAKEN")}
          />
          Taken
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="status"
            value="MISSED"
            checked={status === "MISSED"}
            onChange={() => setStatus("MISSED")}
          />
          Missed
        </label>
      </div>
      <div>
        <label className="block text-xs text-black/60 mb-1">Observation (optional)</label>
        <textarea
          className="w-full border border-black/20 rounded-md p-2 text-sm"
          rows={2}
          value={observation}
          onChange={(e) => setObservation(e.target.value)}
        />
      </div>
      <div>
        <button
          type="button"
          onClick={submit}
          disabled={pending || !status}
          className="px-3 py-2 border border-black rounded-md bg-black text-white text-sm"
          aria-disabled={pending || !status}
        >
          Log intake
        </button>
      </div>
    </div>
  );
}
