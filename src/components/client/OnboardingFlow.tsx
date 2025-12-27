"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { onboardingSubmit } from "@/lib/actions/onboarding";

const timeSlots = [
  { value: "MORNING", label: "Morning" },
  { value: "AFTERNOON", label: "Afternoon" },
  { value: "EVENING", label: "Evening" },
  { value: "NIGHT", label: "Night" },
];

export function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const [conditions, setConditions] = useState<string[]>([]);
  const [conditionInput, setConditionInput] = useState("");
  const [medicationName, setMedicationName] = useState("");
  const [frequency, setFrequency] = useState("");
  const [timing, setTiming] = useState("");
  const [timeSlot, setTimeSlot] = useState("MORNING");
  const [note, setNote] = useState("");
  const [medications, setMedications] = useState<
    Array<{ name: string; timeSlot: string; frequency: string; timing: string; note?: string }>
  >([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const addCondition = () => {
    const trimmed = conditionInput.trim();
    if (!trimmed) return;
    setConditions((prev) => [...prev, trimmed]);
    setConditionInput("");
  };

  const nextStep = () => setStep((s) => Math.min(2, s + 1));
  const prevStep = () => setStep((s) => Math.max(0, s - 1));

  const removeCondition = (index: number) => {
    setConditions((prev) => prev.filter((_, i) => i !== index));
  };

  const addMedication = () => {
    const trimmedName = medicationName.trim();
    const trimmedFrequency = frequency.trim();
    const trimmedTiming = timing.trim();
    const trimmedNote = note.trim();

    if (!trimmedName || !trimmedFrequency || !trimmedTiming) {
      setErrors(["Medication name, frequency, and timing are required before adding"]);
      return;
    }

    setMedications((prev) => [
      ...prev,
      {
        name: trimmedName,
        timeSlot,
        frequency: trimmedFrequency,
        timing: trimmedTiming,
        note: trimmedNote || undefined,
      },
    ]);

    setMedicationName("");
    setFrequency("");
    setTiming("");
    setTimeSlot("MORNING");
    setNote("");
    setErrors([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    if (medications.length === 0) {
      setErrors(["Add at least one medication to continue"]);
      return;
    }

    startTransition(async () => {
      try {
        await onboardingSubmit({
          conditions: conditions.map((name) => ({ name })),
          medications: medications.map((m) => ({
            name: m.name,
            schedule: {
              timeSlot: m.timeSlot,
              frequency: m.frequency,
              timing: m.timing,
              note: m.note,
            },
          })),
        });
        // On success, go to dashboard
        window.location.href = "/dashboard";
      } catch (err: any) {
        const message = err?.message || "Unable to complete onboarding";
        setErrors([message]);
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 text-black">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
          <span>Onboarding</span>
          <span className="text-black/50">/</span>
          <span>
            {step === 0 ? "Intro" : step === 1 ? "Conditions" : "Medication"}
          </span>
        </div>

        {step === 0 && (
          <div className="space-y-3 text-sm">
            <p>Welcome. This setup is informational only. No medical advice or recommendations are provided.</p>
            <p>You can add your diagnosed conditions (optional) and a medication routine.</p>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Diagnosed conditions (optional)</label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., Hypertension"
                  value={conditionInput}
                  onChange={(e) => setConditionInput(e.target.value)}
                />
                <Button type="button" onClick={addCondition} variant="secondary">
                  Add
                </Button>
              </div>
              {conditions.length > 0 && (
                <ul className="text-sm space-y-1">
                  {conditions.map((c, idx) => (
                    <li key={idx} className="flex items-center justify-between border border-black/10 px-2 py-1">
                      <span>{c}</span>
                      <button
                        type="button"
                        onClick={() => removeCondition(idx)}
                        className="border border-black px-2 py-1 text-xs"
                        aria-label={`Remove condition ${c}`}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Medication name</label>
              <Input
                placeholder="e.g., Metformin"
                value={medicationName}
                onChange={(e) => setMedicationName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">Time slot</label>
              <select
                className="w-full border border-black/20 bg-white px-3 py-2 text-sm"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
              >
                {timeSlots.map((slot) => (
                  <option key={slot.value} value={slot.value}>
                    {slot.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">Frequency</label>
              <Input
                placeholder="e.g., once daily"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">Timing</label>
              <Input
                placeholder="e.g., with breakfast"
                value={timing}
                onChange={(e) => setTiming(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">Optional note</label>
              <Input
                placeholder="Any relevant note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <Button type="button" onClick={addMedication} variant="secondary">
                Add medication
              </Button>
            </div>

            {medications.length > 0 && (
              <div className="space-y-2" aria-label="Medication list">
                <p className="text-sm font-medium">Medications added</p>
                <ul className="space-y-2 text-sm">
                  {medications.map((m, idx) => (
                    <li key={`${m.name}-${idx}`} className="border border-black/10 px-3 py-2">
                      <div className="font-semibold">{m.name}</div>
                      <div className="text-black/70">{m.frequency} | {m.timing} | {timeSlots.find((t) => t.value === m.timeSlot)?.label || m.timeSlot}</div>
                      {m.note && <div className="text-black/70">Note: {m.note}</div>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {errors.length > 0 && (
          <div className="border border-black bg-white px-3 py-2 text-sm" role="alert">
            {errors.map((err, idx) => (
              <div key={idx}>{err}</div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3">
          {step > 0 && (
            <Button type="button" onClick={prevStep} variant="secondary">
              Back
            </Button>
          )}
          {step < 2 && (
            <Button type="button" onClick={nextStep} variant="primary">
              Next
            </Button>
          )}
          {step === 2 && (
            <Button type="submit" disabled={isPending} variant="primary">
              {isPending ? "Saving..." : "Finish"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
