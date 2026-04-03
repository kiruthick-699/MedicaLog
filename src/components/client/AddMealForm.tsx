"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { addMealLogAction } from "@/lib/actions/meals";

const mealTypes = [
  { value: "BREAKFAST", label: "Breakfast" },
  { value: "LUNCH", label: "Lunch" },
  { value: "DINNER", label: "Dinner" },
  { value: "OTHER", label: "Other" },
];

export function AddMealForm() {
  const [mealType, setMealType] = useState("BREAKFAST");
  const [descriptionText, setDescriptionText] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    const trimmedDescription = descriptionText.trim();
    if (!trimmedDescription) {
      setErrors(["Please describe what you ate"]);
      return;
    }

    startTransition(async () => {
      try {
        const result = await addMealLogAction({
          mealType,
          descriptionText: trimmedDescription,
        });

        if (!result.ok && result.errors) {
          setErrors(result.errors);
        }
      } catch (err: any) {
        // Ignore redirect errors - they indicate success
        if (err?.message?.includes('NEXT_REDIRECT')) {
          return;
        }
        setErrors(["Failed to log meal"]);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      {errors.length > 0 && (
        <div className="border border-red-200 bg-red-50 p-3 rounded-lg">
          {errors.map((error, idx) => (
            <p key={idx} className="text-sm text-red-700">{error}</p>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="mealType" className="block text-sm font-medium text-black">
          Meal type
        </label>
        <select
          id="mealType"
          className="w-full border border-black/20 bg-white px-3 py-2 text-sm rounded-md"
          value={mealType}
          onChange={(e) => setMealType(e.target.value)}
          disabled={isPending}
        >
          {mealTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="descriptionText" className="block text-sm font-medium text-black">
          What did you eat?
        </label>
        <textarea
          id="descriptionText"
          className="w-full border border-black/20 bg-white px-3 py-2 text-sm rounded-md min-h-24 resize-y"
          placeholder="e.g., Oatmeal with blueberries and honey, black coffee"
          value={descriptionText}
          onChange={(e) => setDescriptionText(e.target.value)}
          disabled={isPending}
          maxLength={1000}
        />
        <p className="text-xs text-black/50">{descriptionText.length}/1000 characters</p>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Logging..." : "Log Meal"}
      </Button>
    </form>
  );
}
