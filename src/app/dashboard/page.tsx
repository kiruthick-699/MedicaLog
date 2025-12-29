import { requireUser } from "@/lib/server/auth";
import { getAwarenessSummary, getUserSchedulesWithLogStatus, getLatestSnapshot } from "@/lib/data/persistence";
import { getAwarenessFlag } from "@/lib/logic/awareness";
import DashboardView from "./DashboardView";

export default async function DashboardPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const resolvedSearchParams = searchParams ? await searchParams : {} as Record<string, string | string[] | undefined>;

  const summary = await getAwarenessSummary(user.id);
  const quickSchedules = await getUserSchedulesWithLogStatus(user.id);
  const adherenceRate = summary.totalMedications === 0
    ? 0
    : Math.min(100, Math.round((summary.totalSchedules / summary.totalMedications) * 100));
  const awarenessFlag = getAwarenessFlag(adherenceRate);

  // Fetch latest AI awareness snapshot (using standard 7-day window)
  const aiSnapshot = await getLatestSnapshot(user.id, "7-day");

  const getParam = (key: string) => {
    const v = (resolvedSearchParams as any)?.[key];
    return Array.isArray(v) ? v[0] : v;
  };
  const intakeLogged = getParam("intakeLogged") === "1";

  return <DashboardView summary={summary} adherenceRate={adherenceRate} awarenessFlag={awarenessFlag} quickSchedules={quickSchedules} intakeLogged={intakeLogged} aiSnapshot={aiSnapshot} />;
}
