/**
 * Intro cards server view
 */

export function IntroCardsView() {
  const benefits = [
    {
      title: "Track Medications",
      description: "Never miss a dose with time-based reminders",
    },
    {
      title: "Monitor Progress",
      description: "See your adherence patterns and health trends",
    },
    {
      title: "Stay Informed",
      description: "Keep your conditions and treatment in one place",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome to MedicaLog</h1>
        <p className="text-gray-600">
          Your personal chronic care companion. Let's set up your medication routine
          in just a few steps.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {benefits.map((benefit) => (
          <div
            key={benefit.title}
            className="bg-gray-50 border border-gray-200 rounded-lg p-6"
          >
            <h2 className="font-semibold text-lg mb-2">{benefit.title}</h2>
            <p className="text-gray-600 text-sm">{benefit.description}</p>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">This setup takes about 5 minutes.</span> You
          can update everything later.
        </p>
      </div>
    </div>
  );
}
