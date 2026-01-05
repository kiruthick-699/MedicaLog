"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestAccessToPatient } from "@/lib/actions/doctor";

export function RequestAccessForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await requestAccessToPatient(email.trim());
      if (result.ok) {
        setEmail("");
        router.push("/doctor/requests?success=1");
        router.refresh();
      } else {
        setError(result.errors?.[0] || "Failed to send request. Please try again.");
      }
    } catch {
      setError("Failed to send request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <div>
        <label htmlFor="patientEmail" className="block mb-2">
          Patient Email
        </label>
        <input
          type="email"
          id="patientEmail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border rounded"
          placeholder="patient@example.com"
          required
          disabled={isSubmitting}
        />
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      <button
        type="submit"
        disabled={isSubmitting || !email.trim()}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? "Sending..." : "Request Access"}
      </button>
    </form>
  );
}
