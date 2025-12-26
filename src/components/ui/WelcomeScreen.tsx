export function WelcomeScreen() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4" aria-labelledby="welcome-title">
      <div className="text-center max-w-xl space-y-4">
        <h1 id="welcome-title" className="text-5xl font-bold tracking-tight text-gray-900">MedicaLog</h1>
        <p className="text-lg text-gray-700">
          Neutral, informational tracking for your chronic care data.
        </p>
        <p className="text-sm text-gray-600">
          This application organizes your information. It does not provide medical advice, diagnosis, or treatment. Consult your healthcare professional for clinical guidance.
        </p>
      </div>
    </main>
  );
}
