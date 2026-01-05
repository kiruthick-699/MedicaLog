'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ActiveAccessItemProps {
  grant: {
    id: string;
    doctorId: string;
    grantedAt: Date;
  };
  onRevokeAccess: (grantId: string) => Promise<{ ok: boolean; errors?: string[] }>;
}

export function ActiveAccessItem({ grant, onRevokeAccess }: ActiveAccessItemProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRevoke() {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await onRevokeAccess(grant.id);
      if (result.ok) {
        router.refresh();
      } else {
        setError("Failed to revoke access. Please try again.");
      }
    } catch {
      setError("Failed to revoke access. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="border rounded p-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="font-medium">Doctor: {grant.doctorId}</div>
          <div className="text-sm text-gray-600">
            Access granted {new Date(grant.grantedAt).toLocaleDateString()}
          </div>
        </div>
        <div className="text-sm font-medium text-green-600">Active</div>
      </div>
      {error && (
        <p className="text-sm text-red-600 mb-4">{error}</p>
      )}
      <button
        onClick={handleRevoke}
        disabled={isSubmitting}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
      >
        {isSubmitting ? "Revoking..." : "Revoke Access"}
      </button>
    </div>
  );
}
