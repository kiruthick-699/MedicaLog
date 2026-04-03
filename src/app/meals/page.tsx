import { requireUser } from "@/lib/server/auth";
import { getMealLogsForDate } from "@/lib/data/persistence";
import { EnhancedMealForm } from "@/components/client/EnhancedMealForm";
import { DailySummaryCard } from "@/components/client/DailySummaryCard";
import Link from "next/link";
import SampleMealDataTable from "./SampleMealDataTable";

export default async function MealsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const todayLogs = await getMealLogsForDate(user.id, new Date());
  const resolvedSearchParams = searchParams ? await searchParams : {};

  const getParam = (key: string) => {
    const v = (resolvedSearchParams as any)?.[key];
    return Array.isArray(v) ? v[0] : v;
  };
  const logged = getParam("logged") === "1";
  const deleted = getParam("deleted") === "1";

  // Group logs by meal type for display
  const mealOrder = ["BREAKFAST", "LUNCH", "DINNER", "OTHER"] as const;
  const logsByType = mealOrder.map((type) => ({
    type,
    label: type === "OTHER" ? "Other" : type.charAt(0) + type.slice(1).toLowerCase(),
    logs: todayLogs.filter((l) => l.mealType === type),
  }));

  return (
    <main className="min-h-screen bg-white" aria-labelledby="meals-title">
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-10">
        {logged && (
          <div className="border border-green-200 bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-800 font-medium">✓ Meal logged successfully</p>
          </div>
        )}
        {deleted && (
          <div className="border border-black/10 rounded-lg p-4 bg-white">
            <p className="text-sm text-black/80">Meal log removed.</p>
          </div>
        )}

        <header className="space-y-3">
          <h1 id="meals-title" className="text-4xl font-bold text-black tracking-tight">Meal Logging</h1>
          <p className="text-base text-black/70 max-w-3xl">
            Record your daily meals for lifestyle awareness. This system does not provide nutritional or medical advice.
          </p>
        </header>

        <section className="space-y-4" aria-label="Quick log">
          <h2 className="text-2xl font-bold text-black">Quick Log</h2>
          <EnhancedMealForm />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-black">Today's Meal Timeline</h2>
              <p className="text-xs text-black/50">
                {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </p>
            </div>

            {todayLogs.length === 0 ? (
              <div className="border border-black/10 rounded-xl p-12 bg-white text-center space-y-3">
                <div className="text-4xl text-black/20">🍽️</div>
                <p className="text-base font-semibold text-black/70">No meals logged yet</p>
                <p className="text-sm text-black/50">Start logging to build awareness of your daily routine.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {logsByType.map(({ type, label, logs }) => (
                  <div key={type} className="border border-black/10 rounded-xl p-4 bg-white">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-xs font-semibold uppercase tracking-widest text-black/60">{label}</p>
                          {logs.length > 0 && (
                            <span className="text-xs text-black/40">
                              {logs[0].loggedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        {logs.length > 0 ? (
                          <div className="space-y-2">
                            {logs.map((log) => (
                              <div key={log.id} className="flex items-start justify-between gap-3">
                                <p className="text-sm text-black/80 flex-1">{log.descriptionText}</p>
                                <Link
                                  href={`/meals/delete/${log.id}`}
                                  className="text-xs text-black/50 underline hover:text-black shrink-0"
                                >
                                  Remove
                                </Link>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-black/30 italic">Not logged yet</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <DailySummaryCard
              totalLogged={todayLogs.length}
              hasBreakfast={logsByType[0].logs.length > 0}
              hasLunch={logsByType[1].logs.length > 0}
              hasDinner={logsByType[2].logs.length > 0}
            />
          </div>
        </div>

        <section className="border-t border-black/10 pt-6 space-y-2" aria-label="History link">
          <Link href="/meals/history" className="inline-flex items-center gap-2 text-sm font-medium text-black hover:text-black/70 underline">
            View Recent Meal History (Last 7 Days) →
          </Link>
        </section>

        <SampleMealDataTable />

        <footer className="border-t border-black/10 pt-6 text-sm text-black/60 text-center">
          Meal logging is for awareness only and does not provide nutritional or medical advice.
        </footer>
      </div>
    </main>
  );
}
