/**
 * Stateless InfoBanner component
 * Neutral informational banner for contextual notes.
 */

export interface InfoBannerProps {
  children: React.ReactNode;
}

export function InfoBanner({ children }: InfoBannerProps) {
  return (
    <div className="border border-gray-200 bg-white text-gray-800 rounded-xl p-4">
      <div className="text-sm">{children}</div>
    </div>
  );
}
