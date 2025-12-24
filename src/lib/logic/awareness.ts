/**
 * Helper to translate adherence rate into a neutral awareness flag.
 * Keeps presentation components free of business calculations.
 */
export function getAwarenessFlag(adherenceRate: number): "On track" | "Needs attention" {
  return adherenceRate >= 80 ? "On track" : "Needs attention";
}
