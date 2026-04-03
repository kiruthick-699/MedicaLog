"use server";

import { requireUser } from "@/lib/server/auth";
import { createMedicationIntakeLog, hasIntakeLogForToday } from "@/lib/data/persistence";

export interface LogMedicationIntakeInput {
  medicationId: string;
  scheduleId: string;
  status: 'TAKEN' | 'MISSED';
}

export interface LogMedicationIntakeResult {
  ok: boolean;
  errors?: string[];
}

export async function logMedicationIntakeAction(
  input: LogMedicationIntakeInput
): Promise<LogMedicationIntakeResult> {
  const user = await requireUser({ onFail: "throw" });

  if (!input.medicationId || !input.scheduleId || !input.status) {
    return { ok: false, errors: ["Missing required fields"] };
  }

  try {
    const alreadyLogged = await hasIntakeLogForToday(input.scheduleId);
    if (alreadyLogged) {
      return { ok: false, errors: ["Already logged for today"] };
    }

    await createMedicationIntakeLog({
      userId: user.id,
      medicationId: input.medicationId,
      scheduleId: input.scheduleId,
      status: input.status as any,
      actualTime: new Date(),
    });

    return { ok: true };
  } catch (err: any) {
    return { ok: false, errors: [err?.message || "Failed to log intake"] };
  }
}
