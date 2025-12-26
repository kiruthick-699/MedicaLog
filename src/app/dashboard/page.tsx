import { requireUser } from "@/lib/server/auth";
import DashboardView from "./DashboardView";

export default async function DashboardPage() {
  await requireUser();
  return <DashboardView />;
}
