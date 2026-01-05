'use client';

import { useState } from 'react';

interface ActiveAccessItemProps {
  grant: any;
  onRevokeAccess: (grantId: string) => Promise<void>;
}

export function ActiveAccessItem({ grant, onRevokeAccess }: ActiveAccessItemProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRevoke() {
    setIsSubmitting(true);
    try {
      await onRevokeAccess(grant.id);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (showConfirmation) {
    return (
      <div className="border rounded p-4 bg-gray-50">
        <h3 className="text-lg font-bold mb-4">Revoke Doctor Access</h3>
        <p className="text-sm text-gray-700 mb-6">
          Once revoked, this doctor will no longer be able to view your data.
          You can grant access again later if needed.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleRevoke}
            disabled={isSubmitting}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            Revoke Access
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
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="font-medium">{grant.doctorName || grant.doctorId}</div>
          <div className="text-sm text-gray-600">
            Access granted {new Date(grant.grantedAt).toLocaleDateString()}
          </div>
        </div>
        <div className="text-sm font-medium text-green-600">Active</div>
      </div>
      <button
        onClick={() => setShowConfirmation(true)}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Revoke Access
      </button>
    </div>
  );
}
