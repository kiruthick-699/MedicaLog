export interface MedicationLog {
  date: string;
  medication: string;
  scheduledTime: string;
  status: 'Taken' | 'Missed';
}

export interface MealLog {
  date: string;
  breakfast?: string;
  lunch?: string;
  dinner?: string;
  snacks?: string;
  hydration: 'Low' | 'Moderate' | 'Good';
}

export function generateSampleMedicationData(): MedicationLog[] {
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

export function generateSampleMealData(): MealLog[] {
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
