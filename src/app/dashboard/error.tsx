"use client";

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <main className="min-h-screen bg-white text-black flex items-center justify-center px-4">
      <div className="max-w-md w-full border border-black/10 p-6 space-y-3" role="alert">
        <h1 className="text-xl font-semibold">Dashboard unavailable</h1>
        <p className="text-sm text-black/70">We hit a problem loading your dashboard data.</p>
        <button
          type="button"
          onClick={reset}
          className="border border-black px-3 py-2 text-sm font-medium"
        >
          Retry
        </button>
      </div>
    </main>
  );
}
