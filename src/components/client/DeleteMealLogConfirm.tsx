"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { deleteMealLogAction } from "@/lib/actions/meals";
import Link from "next/link";

interface DeleteMealLogConfirmProps {
  mealLogId: string;
}

export function DeleteMealLogConfirm({ mealLogId }: DeleteMealLogConfirmProps) {
  const [errors, setErrors] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    setErrors([]);

    startTransition(async () => {
      try {
        const result = await deleteMealLogAction({ mealLogId });

        if (!result.ok && result.errors) {
          setErrors(result.errors);
        }
        // On success, server action redirects to meals page
      } catch (err: any) {
        // Redirect errors are expected and should propagate (they're not real errors)
        if (err?.digest?.includes("NEXT_REDIRECT")) {
          return;
        }
        setErrors([err?.message || "Failed to delete meal log"]);
      }
    });
  };

  return (
    <div className="space-y-4">
      {errors.length > 0 && (
        <div className="border border-red-200 bg-red-50 p-3 rounded-lg">
          {errors.map((error, idx) => (
            <p key={idx} className="text-sm text-red-700">{error}</p>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          variant="primary"
        >
          {isPending ? "Removing..." : "Remove"}
        </Button>
        <Link
          href="/meals"
          className="inline-flex items-center px-4 py-2 border border-black rounded-md text-sm font-medium hover:bg-black/5"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}
