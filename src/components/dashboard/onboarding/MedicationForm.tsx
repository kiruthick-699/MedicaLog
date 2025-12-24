"use client";

import { useState } from "react";
import type { MedicationRoutine } from "@/lib/validation/models";

interface MedicationFormProps {
  onSubmit: (medication: MedicationRoutine) => void;
  isLoading?: boolean;
}

export function MedicationForm({ onSubmit, isLoading = false }: MedicationFormProps) {
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState<MedicationRoutine["frequency"]>(
    "once-daily"
  );
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    // Basic validation
    const newErrors: string[] = [];
    if (!name.trim()) {
      newErrors.push("Medication name is required");
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    // Create mock time slots based on frequency
    const timeSlots =
      frequency === "once-daily"
        ? [{ hour: 8, minute: 0, label: "morning" }]
        : frequency === "twice-daily"
          ? [
              { hour: 8, minute: 0, label: "morning" },
              { hour: 20, minute: 0, label: "evening" },
            ]
          : [{ hour: 8, minute: 0 }];

    const medication: MedicationRoutine = {
      id: `med-${Date.now()}`,
      name: name.trim(),
      frequency,
      timeSlots,
      timing: {},
      note: note.trim() || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    onSubmit(medication);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <ul className="text-sm text-red-900 space-y-1">
            {errors.map((error) => (
              <li key={error}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Medication Name *
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Lisinopril, Metformin"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="frequency" className="block text-sm font-medium mb-1">
          Frequency *
        </label>
        <select
          id="frequency"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as MedicationRoutine["frequency"])}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        >
          <option value="once-daily">Once daily</option>
          <option value="twice-daily">Twice daily</option>
          <option value="three-times-daily">Three times daily</option>
          <option value="four-times-daily">Four times daily</option>
          <option value="every-12-hours">Every 12 hours</option>
          <option value="every-8-hours">Every 8 hours</option>
          <option value="every-6-hours">Every 6 hours</option>
          <option value="as-needed">As needed</option>
        </select>
      </div>

      <div>
        <label htmlFor="note" className="block text-sm font-medium mb-1">
          Notes (optional)
        </label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g., Take with food"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {isLoading ? "Adding..." : "Add Medication"}
      </button>
    </form>
  );
}
