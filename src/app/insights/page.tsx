import { requireUser } from "@/lib/server/auth";
import { InsightsView } from "@/components/server/InsightsView";

export default async function InsightsPage() {
  await requireUser();
  return <InsightsView />;
}
