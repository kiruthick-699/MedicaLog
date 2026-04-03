'use client';

import { useState, useTransition } from 'react';
import { addMealLogAction } from '@/lib/actions/meals';

const mealTypes = [
  { value: 'BREAKFAST', label: 'Breakfast' },
  { value: 'LUNCH', label: 'Lunch' },
  { value: 'DINNER', label: 'Dinner' },
  { value: 'OTHER', label: 'Snack / Other' },
];

const mealTags = [
  'Protein-rich',
  'Light meal',
  'Heavy meal',
  'Processed / Takeout',
  'Homemade',
];

const hydrationLevels = ['Low', 'Moderate', 'Good'];

export function EnhancedMealForm() {
  const [mealType, setMealType] = useState('BREAKFAST');
  const [descriptionText, setDescriptionText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [hydration, setHydration] = useState<string>('');
  const [errors, setErrors] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    const trimmedDescription = descriptionText.trim();
    if (!trimmedDescription) {
      setErrors(['Please describe what you ate']);
      return;
    }

    // Append tags and hydration to description for storage
    let fullDescription = trimmedDescription;
    if (selectedTags.length > 0) {
      fullDescription += ` [Tags: ${selectedTags.join(', ')}]`;
    }
    if (hydration) {
      fullDescription += ` [Hydration: ${hydration}]`;
    }

    startTransition(async () => {
      try {
        const result = await addMealLogAction({
          mealType,
          descriptionText: fullDescription,
        });

        if (!result.ok && result.errors) {
          setErrors(result.errors);
        } else {
          // Reset form on success
          setDescriptionText('');
          setSelectedTags([]);
          setHydration('');
        }
      } catch (err: any) {
        if (err?.message?.includes('NEXT_REDIRECT')) {
          return;
        }
        setErrors(['Failed to log meal']);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="border border-black/10 rounded-xl p-6 bg-white space-y-5">
      {errors.length > 0 && (
        <div className="border border-red-200 bg-red-50 p-3 rounded-lg">
          {errors.map((error, idx) => (
            <p key={idx} className="text-sm text-red-700">{error}</p>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="mealType" className="block text-sm font-semibold text-black">
          Meal Type
        </label>
        <select
          id="mealType"
          className="w-full border border-black/20 bg-white px-3 py-2 text-sm rounded-md"
          value={mealType}
          onChange={(e) => setMealType(e.target.value)}
          disabled={isPending}
        >
          {mealTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="descriptionText" className="block text-sm font-semibold text-black">
          Food Description
        </label>
        <textarea
          id="descriptionText"
          className="w-full border border-black/20 bg-white px-3 py-2 text-sm rounded-md min-h-24 resize-y"
          placeholder="e.g., Idli with sambar, Rice with dal and vegetables, Grilled chicken with salad"
          value={descriptionText}
          onChange={(e) => setDescriptionText(e.target.value)}
          disabled={isPending}
          maxLength={1000}
        />
        <p className="text-xs text-black/50">{descriptionText.length}/1000 characters</p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-black">
          Optional Tags <span className="text-black/50 font-normal">(Select any that apply)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {mealTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              disabled={isPending}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                selectedTags.includes(tag)
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-black/70 border-black/20 hover:border-black/40'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-black">
          Hydration Today <span className="text-black/50 font-normal">(Optional)</span>
        </label>
        <div className="flex gap-2">
          {hydrationLevels.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setHydration(level === hydration ? '' : level)}
              disabled={isPending}
              className={`flex-1 px-3 py-2 text-sm rounded-md border transition-colors ${
                hydration === level
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-black/70 border-black/20 hover:border-black/40'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-black text-white px-4 py-2.5 text-sm font-medium rounded-md hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Logging...' : 'Log Meal'}
      </button>
    </form>
  );
}
