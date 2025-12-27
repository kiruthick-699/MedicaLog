"use client";

export default function RootError({ reset }: { reset: () => void }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white text-black px-4">
      <div className="max-w-md w-full border border-black/10 p-6 space-y-3" role="alert">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="text-sm text-black/70">An unexpected error occurred while loading this page.</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={reset}
            className="border border-black px-3 py-2 text-sm font-medium"
          >
            Retry
          </button>
          <a href="/" className="text-sm underline text-black">Home</a>
        </div>
      </div>
    </main>
  );
}
