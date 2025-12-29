"use server";

import {
  getDiagnosedConditionById,
  updateDiagnosedCondition,
  deleteDiagnosedCondition,
} from "@/lib/data/persistence";
import { requireUser } from "@/lib/server/auth";
import { validateConditionName, validateNote } from "@/lib/validation/inputSchemas";
import { mapToSafeError } from "@/lib/errors";
import { regenerateSnapshotAsync } from "@/lib/ai/generateAwarenessSnapshot";
import { redirect } from "next/navigation";

export interface EditConditionInput {
  conditionId: string;
  name: string;
  note?: string;
}

export interface EditConditionResult {
  ok: boolean;
  errors?: string[];
}

export async function editConditionAction(input: EditConditionInput): Promise<EditConditionResult> {
  const user = await requireUser({ onFail: "throw" });

  if (!input || typeof input !== "object") {
    return { ok: false, errors: ["Invalid input"] };
  }

  const errors: string[] = [];
  const nameValidation = validateConditionName(input.name);
  if (!nameValidation.ok) errors.push(...nameValidation.errors);
  const noteValidation = validateNote(input.note);
  if (!noteValidation.ok) errors.push(...noteValidation.errors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const safeName = nameValidation.ok ? nameValidation.value : "";
  const safeNote = noteValidation.ok ? noteValidation.value : undefined;

  try {
    const existing = await getDiagnosedConditionById(input.conditionId);
    if (!existing || existing.userId !== user.id) {
      return { ok: false, errors: ["Condition not found or not accessible"] };
    }

    await updateDiagnosedCondition(user.id, input.conditionId, {
      name: safeName,
      note: safeNote,
    });

    // Trigger async snapshot regeneration
    regenerateSnapshotAsync(user.id, "30d").catch(() => {
      // Silently ignore snapshot generation errors; user action succeeded
    });

    // Success: redirect to list with confirmation
    const nameParam = encodeURIComponent(safeName || "Condition");
    redirect(`/conditions?updated=1&name=${nameParam}`);
  } catch (err) {
    const safe = mapToSafeError(err, "Failed to update condition");
    return { ok: false, errors: [safe.message] };
  }
}

export interface DeleteConditionInput {
  conditionId: string;
}

export interface DeleteConditionResult {
  ok: boolean;
  errors?: string[];
}

export async function deleteConditionAction(input: DeleteConditionInput): Promise<DeleteConditionResult> {
  const user = await requireUser({ onFail: "throw" });

  if (!input || typeof input !== "object") {
    return { ok: false, errors: ["Invalid input"] };
  }

  try {
    const existing = await getDiagnosedConditionById(input.conditionId);
    if (!existing || existing.userId !== user.id) {
      return { ok: false, errors: ["Condition not found or not accessible"] };
    }

    const nameParam = encodeURIComponent(existing.name || "Condition");
    await deleteDiagnosedCondition(user.id, input.conditionId);

    // Trigger async snapshot regeneration
    regenerateSnapshotAsync(user.id, "30d").catch(() => {
      // Silently ignore snapshot generation errors; user action succeeded
    });

    // Success: redirect to list with confirmation
    redirect(`/conditions?deleted=1&name=${nameParam}`);
  } catch (err) {
    const safe = mapToSafeError(err, "Failed to delete condition");
    return { ok: false, errors: [safe.message] };
  }
}
