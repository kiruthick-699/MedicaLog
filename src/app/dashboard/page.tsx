import { requireUser } from "@/lib/server/auth";
import { getAwarenessSummary } from "@/lib/data/persistence";
import { getAwarenessFlag } from "@/lib/logic/awareness";
import DashboardView from "./DashboardView";

export default async function DashboardPage() {
  const user = await requireUser();

  const summary = await getAwarenessSummary(user.id);
  const adherenceRate = summary.totalMedications === 0
    ? 0
    : Math.min(100, Math.round((summary.totalSchedules / summary.totalMedications) * 100));
  const awarenessFlag = getAwarenessFlag(adherenceRate);

  return <DashboardView summary={summary} adherenceRate={adherenceRate} awarenessFlag={awarenessFlag} />;
}
