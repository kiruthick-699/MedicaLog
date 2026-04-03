interface DayLog {
  date: string;
  breakfast?: string;
  lunch?: string;
  dinner?: string;
  snacks?: string;
  hydration: 'Low' | 'Moderate' | 'Good';
}

function generateMealData(): DayLog[] {
  const meals = {
    breakfast: [
      'Coffee, toast with butter',
      'Cereal with milk',
      'Scrambled eggs, toast',
      'Bagel with cream cheese',
      'Skipped',
      'Granola bar, coffee',
      'Pancakes with syrup'
    ],
    lunch: [
      'Sandwich, chips',
      'Leftover pizza',
      'Salad with chicken',
      'Burger and fries',
      'Pasta with marinara',
      'Skipped',
      'Ramen noodles',
      'Wrap with turkey'
    ],
    dinner: [
      'Chicken, rice, vegetables',
      'Takeout Chinese food',
      'Spaghetti with meatballs',
      'Grilled fish, potatoes',
      'Pizza delivery',
      'Stir fry with beef',
      'Tacos with beans'
    ],
    snacks: [
      'Cookies, soda',
      'Chips',
      'Apple',
      'Candy bar',
      'Crackers',
      'Ice cream',
      null
    ]
  };

  const data: DayLog[] = [];
  const today = new Date();

  for (let i = 13; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const skipBreakfast = isWeekend && Math.random() > 0.6;
    const skipLunch = Math.random() > 0.85;
    const hasSnacks = Math.random() > 0.4;

    let hydration: 'Low' | 'Moderate' | 'Good';
    const rand = Math.random();
    if (rand > 0.7) hydration = 'Good';
    else if (rand > 0.35) hydration = 'Moderate';
    else hydration = 'Low';

    data.push({
      date: dateStr,
      breakfast: skipBreakfast ? undefined : meals.breakfast[Math.floor(Math.random() * meals.breakfast.length)],
      lunch: skipLunch ? undefined : meals.lunch[Math.floor(Math.random() * meals.lunch.length)],
      dinner: meals.dinner[Math.floor(Math.random() * meals.dinner.length)],
      snacks: hasSnacks ? (meals.snacks[Math.floor(Math.random() * meals.snacks.length)] || undefined) : undefined,
      hydration
    });
  }

  return data;
}

export default function SampleMealDataTable() {
  const data = generateMealData();

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-black">14-Day Sample Meal Log</h2>
      <div className="border border-black/10 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-black/5 border-b border-black/10">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-black">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-black">Breakfast</th>
                <th className="text-left px-4 py-3 font-semibold text-black">Lunch</th>
                <th className="text-left px-4 py-3 font-semibold text-black">Dinner</th>
                <th className="text-left px-4 py-3 font-semibold text-black">Snacks</th>
                <th className="text-left px-4 py-3 font-semibold text-black">Hydration</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3 text-black/80 font-medium">{row.date}</td>
                  <td className="px-4 py-3 text-black/70">{row.breakfast || <span className="text-black/30 italic">—</span>}</td>
                  <td className="px-4 py-3 text-black/70">{row.lunch || <span className="text-black/30 italic">—</span>}</td>
                  <td className="px-4 py-3 text-black/70">{row.dinner}</td>
                  <td className="px-4 py-3 text-black/70">{row.snacks || <span className="text-black/30 italic">—</span>}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      row.hydration === 'Good' ? 'bg-black/10 text-black' :
                      row.hydration === 'Moderate' ? 'bg-black/5 text-black/70' :
                      'bg-black/5 text-black/40'
                    }`}>
                      {row.hydration}
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
