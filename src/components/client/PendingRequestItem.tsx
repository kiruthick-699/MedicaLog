'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PendingRequestItemProps {
  request: {
    id: string;
    doctorId: string;
    createdAt: Date;
  };
  onAllowMonitoring: (requestId: string) => Promise<{ ok: boolean; errors?: string[] }>;
  onDeclineRequest: (requestId: string) => Promise<{ ok: boolean; errors?: string[] }>;
}

export function PendingRequestItem({
  request,
  onAllowMonitoring,
  onDeclineRequest,
}: PendingRequestItemProps) {
  const router = useRouter();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await onAllowMonitoring(request.id);
      if (result.ok) {
        router.refresh();
      } else {
        setError("Failed to approve request. Please try again.");
      }
    } catch {
      setError("Failed to approve request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDecline() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await onDeclineRequest(request.id);
      if (result.ok) {
        router.refresh();
      } else {
        setError("Failed to decline request. Please try again.");
      }
    } catch {
      setError("Failed to decline request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (showConfirmation) {
    return (
      <div className="border rounded p-4 bg-gray-50">
        <h3 className="text-lg font-bold mb-4">Confirm Doctor Access</h3>
        <p className="text-sm text-gray-700 mb-6">
          By confirming, you allow this doctor to view your medication adherence logs.
          This access is read-only and can be revoked at any time.
        </p>
        {error && (
          <p className="text-sm text-red-600 mb-4">{error}</p>
        )}
        <div className="flex gap-3">
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {isSubmitting ? "Processing..." : "Confirm Access"}
          </button>
          <button
            onClick={() => setShowConfirmation(false)}
            disabled={isSubmitting}
            className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded p-4">
      <div className="font-medium mb-2">Doctor: {request.doctorId}</div>
      <div className="text-sm text-gray-600 mb-4">
        Requested {new Date(request.createdAt).toLocaleDateString()}
      </div>

      {error && (
        <p className="text-sm text-red-600 mb-4">{error}</p>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4 text-sm">
        <p className="mb-3">
          The doctor will be able to view your medication schedule and intake logs.
        </p>
        <p className="font-medium mb-2">They will NOT be able to:</p>
        <ul className="space-y-1 ml-4">
          <li>• send messages</li>
          <li>• give advice</li>
          <li>• modify your data</li>
          <li>• access information without your consent</li>
        </ul>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setShowConfirmation(true)}
          disabled={isSubmitting}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          Allow Monitoring
        </button>
        <button
          onClick={handleDecline}
          disabled={isSubmitting}
          className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400 disabled:opacity-50"
        >
          {isSubmitting ? "Processing..." : "Decline"}
        </button>
      </div>
    </div>
  );
}
