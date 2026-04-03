"use server";

import { requireUser } from "@/lib/server/auth";
import { createMedicationWithSchedules } from "@/lib/data/persistence";
import { redirect } from "next/navigation";

export interface CreateMedicationWithScheduleInput {
  name: string;
  frequency: string;
  timeSlots: string[];
  timingRelation: string;
}

export interface CreateMedicationWithScheduleResult {
  ok: boolean;
  errors?: string[];
  medicationId?: string;
}

export async function createMedicationWithScheduleAction(
  input: CreateMedicationWithScheduleInput
): Promise<CreateMedicationWithScheduleResult> {
  const user = await requireUser({ onFail: "throw" });

  if (!input.name?.trim()) {
    return { ok: false, errors: ["Medication name is required"] };
  }

  if (!input.timeSlots || input.timeSlots.length === 0) {
    return { ok: false, errors: ["At least one time slot is required"] };
  }

  try {
    const schedules = input.timeSlots.map(slot => ({
      timeSlot: slot as any,
      frequency: input.frequency,
      timing: input.timingRelation,
      note: null,
    }));

    const result = await createMedicationWithSchedules(
      user.id,
      { name: input.name.trim() },
      schedules
    );

    redirect(`/medications?added=1&name=${encodeURIComponent(result.name)}`);
  } catch (err: any) {
    if (err?.message?.includes('NEXT_REDIRECT')) {
      throw err;
    }
    return { ok: false, errors: ["Failed to create medication"] };
  }
}
