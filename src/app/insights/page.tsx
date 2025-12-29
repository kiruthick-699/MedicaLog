import { requireUser } from "@/lib/server/auth";
import { getAwarenessSummary, getLatestSnapshot } from "@/lib/data/persistence";
import { getAwarenessFlag } from "@/lib/logic/awareness";
import { InsightsView } from "@/components/server/InsightsView";

export default async function InsightsPage() {
  const user = await requireUser();
  const summary = await getAwarenessSummary(user.id);
  const adherenceRate = summary.totalMedications === 0
    ? 0
    : Math.min(100, Math.round((summary.totalSchedules / summary.totalMedications) * 100));
  const awarenessFlag = getAwarenessFlag(adherenceRate);

  // Fetch latest AI awareness snapshot (using standard 7-day window)
  const aiSnapshot = await getLatestSnapshot(user.id, "7-day");

  return <InsightsView summary={summary} adherenceRate={adherenceRate} awarenessFlag={awarenessFlag} aiSnapshot={aiSnapshot} />;
}
