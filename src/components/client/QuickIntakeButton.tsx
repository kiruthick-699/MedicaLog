"use client";

import { useState, useTransition } from "react";
import { logMedicationIntakeAction } from "@/lib/actions/medications";

export default function QuickIntakeButton(props: {
  medicationId: string;
  scheduleId: string;
  alreadyLogged: boolean;
}) {
  const { medicationId, scheduleId, alreadyLogged } = props;
  const [done, setDone] = useState<boolean>(false);
  const [pending, startTransition] = useTransition();

  if (alreadyLogged || done) {
    return <p className="text-sm text-black/60">Already logged today</p>;
  }

  const trigger = (status: "TAKEN" | "MISSED") => {
    if (pending) return;
    startTransition(async () => {
      await logMedicationIntakeAction({
        medicationId,
        scheduleId,
        status,
        redirectTo: "/dashboard?intakeLogged=1",
      });
      setDone(true);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => trigger("TAKEN")}
        disabled={pending}
        className="px-3 py-1 border border-black rounded-md bg-black text-white text-xs"
        aria-disabled={pending}
      >
        Mark taken
      </button>
      <button
        type="button"
        onClick={() => trigger("MISSED")}
        disabled={pending}
        className="px-3 py-1 border border-black rounded-md bg-white text-black text-xs"
        aria-disabled={pending}
      >
        Mark missed
      </button>
    </div>
  );
}
