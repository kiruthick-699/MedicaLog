'use client';

interface MedicationLog {
  date: string;
  medication: string;
  scheduledTime: string;
  status: 'Taken' | 'Missed';
}

interface MealLog {
  date: string;
  breakfast?: string;
  lunch?: string;
  dinner?: string;
  snacks?: string;
  hydration: 'Low' | 'Moderate' | 'Good';
}

function generateMedicationData(): MedicationLog[] {
  const medications = [
    { name: 'Metformin', time: 'Morning', missRate: 0.15 },
    { name: 'Lisinopril', time: 'Morning', missRate: 0.12 },
    { name: 'Atorvastatin', time: 'Night', missRate: 0.25 }
  ];

  const data: MedicationLog[] = [];
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

function generateMealData(): MealLog[] {
  const meals = {
    breakfast: ['Coffee, toast with butter', 'Cereal with milk', 'Scrambled eggs, toast', 'Bagel with cream cheese', 'Skipped', 'Granola bar, coffee', 'Pancakes with syrup'],
    lunch: ['Sandwich, chips', 'Leftover pizza', 'Salad with chicken', 'Burger and fries', 'Pasta with marinara', 'Skipped', 'Ramen noodles', 'Wrap with turkey'],
    dinner: ['Chicken, rice, vegetables', 'Takeout Chinese food', 'Spaghetti with meatballs', 'Grilled fish, potatoes', 'Pizza delivery', 'Stir fry with beef', 'Tacos with beans'],
    snacks: ['Cookies, soda', 'Chips', 'Apple', 'Candy bar', 'Crackers', 'Ice cream', null]
  };

  const data: MealLog[] = [];
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

function computeMetrics(medData: MedicationLog[], mealData: MealLog[]) {
  const taken = medData.filter(d => d.status === 'Taken').length;
  const adherence = Math.round((taken / medData.length) * 100);

  const morningMissed = medData.filter(d => d.scheduledTime === 'Morning' && d.status === 'Missed').length;
  const nightMissed = medData.filter(d => d.scheduledTime === 'Night' && d.status === 'Missed').length;
  const missedPattern = nightMissed > morningMissed ? 'Night doses missed more frequently' : 'Morning doses missed more frequently';

  const week1 = medData.slice(0, 21);
  const week2 = medData.slice(21);
  const week1Adherence = Math.round((week1.filter(d => d.status === 'Taken').length / week1.length) * 100);
  const week2Adherence = Math.round((week2.filter(d => d.status === 'Taken').length / week2.length) * 100);
  const trend = week2Adherence > week1Adherence + 5 ? 'Improving' : week2Adherence < week1Adherence - 5 ? 'Declining' : 'Stable';

  const skippedMeals = mealData.filter(d => !d.breakfast || !d.lunch).length;
  const mealRegularity = skippedMeals > 4 ? 'Irregular' : 'Consistent';

  const proteinMeals = mealData.filter(d => 
    (d.breakfast?.includes('egg') || d.lunch?.includes('chicken') || d.lunch?.includes('turkey') || d.dinner?.includes('chicken') || d.dinner?.includes('fish') || d.dinner?.includes('beef'))
  ).length;
  const proteinIntake = proteinMeals < 7 ? 'Low' : proteinMeals < 11 ? 'Moderate' : 'Good';

  const goodHydration = mealData.filter(d => d.hydration === 'Good').length;
  const hydrationPattern = goodHydration < 4 ? 'Inconsistent - mostly low/moderate' : goodHydration < 8 ? 'Moderate consistency' : 'Good consistency';

  const routineConsistency = adherence > 80 && mealRegularity === 'Consistent' ? 'Strong' : adherence > 65 ? 'Moderate' : 'Weak';

  const habitStrength = adherence > 85 ? 'Strong' : adherence > 70 ? 'Moderate' : 'Weak';

  const adherenceRisk = adherence < 70 ? 'High' : adherence < 85 ? 'Moderate' : 'Low';

  return {
    adherence,
    missedPattern,
    trend,
    mealRegularity,
    proteinIntake,
    hydrationPattern,
    routineConsistency,
    habitStrength,
    adherenceRisk
  };
}

export default function AIInsights() {
  const medData = generateMedicationData();
  const mealData = generateMealData();
  const metrics = computeMetrics(medData, mealData);

  return (
    <section className="border border-black/10 rounded-2xl p-8 bg-white space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-black">AI Insights</h2>
        <p className="text-sm text-black/70">
          Computed from 14-day sample data. For awareness only—not medical advice.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-black/60">Adherence Percentage</p>
          <p className="text-4xl font-bold text-black">{metrics.adherence}%</p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-black/60">Missed Dose Pattern</p>
          <p className="text-base font-medium text-black/80">{metrics.missedPattern}</p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-black/60">Trend</p>
          <p className="text-base font-medium text-black/80">{metrics.trend}</p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-black/60">Meal Regularity</p>
          <p className="text-base font-medium text-black/80">{metrics.mealRegularity}</p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-black/60">Protein Intake</p>
          <p className="text-base font-medium text-black/80">{metrics.proteinIntake}</p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-black/60">Hydration Pattern</p>
          <p className="text-base font-medium text-black/80">{metrics.hydrationPattern}</p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-black/60">Routine Consistency</p>
          <p className="text-base font-medium text-black/80">{metrics.routineConsistency}</p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-black/60">Habit Strength</p>
          <p className="text-base font-medium text-black/80">{metrics.habitStrength}</p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-black/60">Adherence Risk Level</p>
          <p className={`text-base font-medium ${
            metrics.adherenceRisk === 'High' ? 'text-black/90' :
            metrics.adherenceRisk === 'Moderate' ? 'text-black/80' :
            'text-black/70'
          }`}>{metrics.adherenceRisk}</p>
        </div>
      </div>
    </section>
  );
}
