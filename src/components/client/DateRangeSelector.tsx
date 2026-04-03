'use client';

interface DateRangeSelectorProps {
  currentDays: number;
}

export function DateRangeSelector({ currentDays }: DateRangeSelectorProps) {
  return (
    <select
      defaultValue={currentDays.toString()}
      className="border border-black/20 bg-white px-3 py-2 text-sm rounded-md"
      onChange={(e) => {
        window.location.href = `/wellness-report?days=${e.target.value}`;
      }}
    >
      <option value="7">Last 7 days</option>
      <option value="14">Last 14 days</option>
      <option value="30">Last 30 days</option>
      <option value="90">Last 90 days</option>
    </select>
  );
}
