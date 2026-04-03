interface SampleDataRow {
  date: string;
  medication: string;
  scheduledTime: string;
  status: 'Taken' | 'Missed';
}

function generateSampleData(): SampleDataRow[] {
  const medications = [
    { name: 'Metformin', time: 'Morning', missRate: 0.15 },
    { name: 'Lisinopril', time: 'Morning', missRate: 0.12 },
    { name: 'Atorvastatin', time: 'Night', missRate: 0.25 }
  ];

  const data: SampleDataRow[] = [];
  const today = new Date();

  for (let i = 13; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    medications.forEach(med => {
      let missChance = med.missRate;
      if (isWeekend) missChance += 0.1;
      if (med.time === 'Night') missChance += 0.05;
      if (i > 7) missChance += 0.08;

      const status: 'Taken' | 'Missed' = Math.random() > missChance ? 'Taken' : 'Missed';
      data.push({
        date: dateStr,
        medication: med.name,
        scheduledTime: med.time,
        status
      });
    });
  }

  return data;
}

export default function SampleDataTable() {
  const data = generateSampleData();
  const taken = data.filter(d => d.status === 'Taken').length;
  const adherence = Math.round((taken / data.length) * 100);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-black">14-Day Sample Data</h2>
        <div className="text-sm text-black/70">
          Adherence: <span className="font-semibold text-black">{adherence}%</span>
        </div>
      </div>
      <div className="border border-black/10 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-black/5 border-b border-black/10">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-black">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-black">Medication</th>
                <th className="text-left px-4 py-3 font-semibold text-black">Scheduled Time</th>
                <th className="text-left px-4 py-3 font-semibold text-black">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3 text-black/80">{row.date}</td>
                  <td className="px-4 py-3 text-black">{row.medication}</td>
                  <td className="px-4 py-3 text-black/70">{row.scheduledTime}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      row.status === 'Taken' 
                        ? 'bg-black/10 text-black' 
                        : 'bg-black/5 text-black/50'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
