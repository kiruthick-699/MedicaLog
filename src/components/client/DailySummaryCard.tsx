'use client';

interface DailySummaryProps {
  totalLogged: number;
  hasBreakfast: boolean;
  hasLunch: boolean;
  hasDinner: boolean;
}

export function DailySummaryCard({ totalLogged, hasBreakfast, hasLunch, hasDinner }: DailySummaryProps) {
  const mealsExpected = 4; // Breakfast, Lunch, Dinner, Snack
  const mainMealsLogged = [hasBreakfast, hasLunch, hasDinner].filter(Boolean).length;
  
  const timingConsistency = mainMealsLogged >= 3 ? 'Regular' : mainMealsLogged >= 2 ? 'Moderate' : 'Irregular';
  
  let patternNote = '';
  if (totalLogged === 0) {
    patternNote = 'No meals logged yet today';
  } else if (mainMealsLogged === 3) {
    patternNote = 'All main meals logged consistently';
  } else if (mainMealsLogged >= 2) {
    patternNote = 'Some meals logged today';
  } else {
    patternNote = 'Some meals skipped';
  }

  return (
    <div className="border border-black/10 rounded-xl p-6 bg-white space-y-4">
      <h3 className="text-lg font-bold text-black">Daily Summary</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-black/60">Meals Logged</p>
          <p className="text-2xl font-bold text-black">{totalLogged} / {mealsExpected}</p>
        </div>
        
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-black/60">Timing Consistency</p>
          <p className="text-lg font-semibold text-black">{timingConsistency}</p>
        </div>
      </div>
      
      <div className="border-t border-black/10 pt-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-black/60 mb-1">Pattern Note</p>
        <p className="text-sm text-black/70">{patternNote}</p>
      </div>
      
      <div className="text-xs text-black/50 italic">
        This summary is for awareness only and does not provide nutritional guidance.
      </div>
    </div>
  );
}
