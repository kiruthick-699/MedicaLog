'use client';

import { useState, useTransition } from 'react';
import { createMedicationWithScheduleAction } from '@/lib/actions/medications';

const frequencies = [
  { value: 'once-daily', label: 'Once daily', slots: 1 },
  { value: 'twice-daily', label: 'Twice daily', slots: 2 },
  { value: 'three-times-daily', label: 'Three times daily', slots: 3 },
];

const timeSlots = ['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'];

const timingRelations = [
  'Before food',
  'After food',
  'With food',
  'No preference',
];

export function UnifiedMedicationForm() {
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState('once-daily');
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [timingRelation, setTimingRelation] = useState('No preference');
  const [errors, setErrors] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const slotsNeeded = frequencies.find(f => f.value === frequency)?.slots || 1;

  const toggleSlot = (slot: string) => {
    if (selectedSlots.includes(slot)) {
      setSelectedSlots(prev => prev.filter(s => s !== slot));
    } else {
      if (selectedSlots.length < slotsNeeded) {
        setSelectedSlots(prev => [...prev, slot]);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    if (!name.trim()) {
      setErrors(['Medication name is required']);
      return;
    }

    if (selectedSlots.length !== slotsNeeded) {
      setErrors([`Please select exactly ${slotsNeeded} time slot(s)`]);
      return;
    }

    startTransition(async () => {
      try {
        const result = await createMedicationWithScheduleAction({
          name: name.trim(),
          frequency,
          timeSlots: selectedSlots,
          timingRelation,
        });

        if (!result.ok) {
          setErrors(result.errors || ['Failed to create medication']);
        }
      } catch (err: any) {
        if (err?.message?.includes('NEXT_REDIRECT')) {
          return;
        }
        setErrors(['An unexpected error occurred']);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="border border-black/10 rounded-xl p-6 bg-white space-y-5">
      {errors.length > 0 && (
        <div className="border border-red-200 bg-red-50 p-3 rounded-lg">
          {errors.map((error, idx) => (
            <p key={idx} className="text-sm text-red-700">{error}</p>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-semibold text-black">
          Medication Name <span className="text-red-600">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Metformin, Lisinopril"
          className="w-full border border-black/20 bg-white px-3 py-2 text-sm rounded-md"
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="frequency" className="block text-sm font-semibold text-black">
          Schedule Frequency <span className="text-red-600">*</span>
        </label>
        <select
          id="frequency"
          value={frequency}
          onChange={(e) => {
            setFrequency(e.target.value);
            const slots = frequencies.find(f => f.value === e.target.value)?.slots || 1;
            if (selectedSlots.length > slots) {
              setSelectedSlots(prev => prev.slice(0, slots));
            }
          }}
          className="w-full border border-black/20 bg-white px-3 py-2 text-sm rounded-md"
          disabled={isPending}
        >
          {frequencies.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-black">
          Time Slots <span className="text-red-600">*</span>
          <span className="text-black/50 font-normal ml-2">
            (Select {slotsNeeded})
          </span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {timeSlots.map(slot => {
            const isSelected = selectedSlots.includes(slot);
            const canSelect = !isSelected && selectedSlots.length < slotsNeeded;
            const canDeselect = isSelected && selectedSlots.length > 1;
            
            return (
              <button
                key={slot}
                type="button"
                onClick={() => toggleSlot(slot)}
                disabled={isPending || (!isSelected && !canSelect)}
                className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                  isSelected
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-black/70 border-black/20 hover:border-black/40 disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                {slot.charAt(0) + slot.slice(1).toLowerCase()}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="timing" className="block text-sm font-semibold text-black">
          Timing Relation <span className="text-black/50 font-normal">(Optional)</span>
        </label>
        <select
          id="timing"
          value={timingRelation}
          onChange={(e) => setTimingRelation(e.target.value)}
          className="w-full border border-black/20 bg-white px-3 py-2 text-sm rounded-md"
          disabled={isPending}
        >
          {timingRelations.map(rel => (
            <option key={rel} value={rel}>{rel}</option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-black text-white px-4 py-2.5 text-sm font-medium rounded-md hover:bg-black/90 disabled:opacity-50"
      >
        {isPending ? 'Creating...' : 'Create Medication & Schedule'}
      </button>
    </form>
  );
}
