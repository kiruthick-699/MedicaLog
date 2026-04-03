'use client';

import { useState, useTransition } from 'react';
import { logMedicationIntakeAction } from '@/lib/actions/medicationIntake';

interface IntakeLoggerProps {
  scheduleId: string;
  medicationId: string;
  timeSlot: string;
  alreadyLogged: boolean;
}

export function IntakeLogger({ scheduleId, medicationId, timeSlot, alreadyLogged }: IntakeLoggerProps) {
  const [logged, setLogged] = useState(alreadyLogged);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleLog = (status: 'TAKEN' | 'MISSED') => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await logMedicationIntakeAction({
          medicationId,
          scheduleId,
          status,
        });

        if (result.ok) {
          setLogged(true);
        } else {
          setError(result.errors?.[0] || 'Failed to log intake');
        }
      } catch (err: any) {
        if (!err?.message?.includes('NEXT_REDIRECT')) {
          setError('An unexpected error occurred');
        }
      }
    });
  };

  if (logged) {
    return (
      <div className="text-sm text-black/60">
        \u2713 Logged for today
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
      <div className="flex gap-2">
        <button
          onClick={() => handleLog('TAKEN')}
          disabled={isPending}
          className="px-3 py-1.5 text-xs bg-black text-white rounded-md hover:bg-black/90 disabled:opacity-50"
        >
          Mark Taken
        </button>
        <button
          onClick={() => handleLog('MISSED')}
          disabled={isPending}
          className="px-3 py-1.5 text-xs border border-black/20 text-black/70 rounded-md hover:bg-black/5 disabled:opacity-50"
        >
          Mark Missed
        </button>
      </div>
    </div>
  );
}
