import { requireUser } from "@/lib/server/auth";
import { getDiagnosedConditionsForUser } from "@/lib/data/persistence";

export default async function ConditionsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const conditions = await getDiagnosedConditionsForUser(user.id);
  const resolvedSearchParams = searchParams ? await searchParams : {};

  return (
    <main className="min-h-screen bg-white" aria-labelledby="conditions-title">
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-10">
        {(() => {
          const getParam = (key: string) => {
            const v = (resolvedSearchParams as any)?.[key];
            return Array.isArray(v) ? v[0] : v;
          };
          const updated = getParam("updated");
          const deleted = getParam("deleted");
          const nameParam = getParam("name");
          const name = nameParam ? decodeURIComponent(nameParam) : undefined;
          const any = updated === "1" || deleted === "1";
          if (!any) return null;
          const message = updated === "1"
            ? `${name ?? "Condition"} has been updated.`
            : `${name ?? "Condition"} has been removed.`;
          return (
            <div className="border border-black/10 rounded-lg p-4 bg-white">
              <p className="text-sm text-black/80">{message}</p>
            </div>
          );
        })()}
        <header className="space-y-2">
          <h1 id="conditions-title" className="text-4xl font-bold text-black tracking-tight">Diagnosed conditions</h1>
          <p className="text-sm text-black/70">Reference-only list. No medical interpretation or advice.</p>
        </header>

        {conditions.length === 0 ? (
          <p className="text-sm text-black/70">No diagnosed conditions are recorded. You can maintain this list only if it helps you keep track; it’s fine to leave it empty.</p>
        ) : (
          <section className="space-y-4" aria-label="Conditions list">
            {conditions.map((condition) => (
              <div key={condition.id} className="border border-black/10 rounded-xl p-4 bg-white flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-black">{condition.name}</p>
                  {condition.note ? <p className="text-sm text-black/70">{condition.note}</p> : null}
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <a className="underline" href={`/conditions/${condition.id}/edit`}>Edit</a>
                  <a className="underline" href={`/conditions/${condition.id}/delete`}>Delete</a>
                </div>
              </div>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
