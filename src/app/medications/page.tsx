import { requireUser } from "@/lib/server/auth";
import { getUserWithRelations, getMedicationWithSchedules } from "@/lib/data/persistence";
import Link from "next/link";

export default async function MedicationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const data = await getUserWithRelations(user.id);

  const medications = data?.medications ?? [];

  // Fetch schedules count per medication (read-only, server-side)
  const items = await Promise.all(
    medications.map(async (m) => {
      const withSchedules = await getMedicationWithSchedules(m.id);
      return {
        id: m.id,
        name: m.name,
        schedulesCount: withSchedules?.schedules.length ?? 0,
      };
    })
  );
  const resolvedSearchParams = await searchParams;
  const deleted = typeof resolvedSearchParams?.deleted === "string" ? resolvedSearchParams!.deleted : Array.isArray(resolvedSearchParams?.deleted) ? resolvedSearchParams!.deleted?.[0] : undefined;
  const deletedNameParam = typeof resolvedSearchParams?.name === "string" ? resolvedSearchParams!.name : Array.isArray(resolvedSearchParams?.name) ? resolvedSearchParams!.name?.[0] : undefined;
  const deletedName = deletedNameParam ? decodeURIComponent(deletedNameParam) : undefined;

  return (
    <main className="min-h-screen bg-white" aria-labelledby="medications-title">
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-10">
        {deleted === "1" ? (
          <div className="border border-black/10 rounded-lg p-4 bg-white">
            <p className="text-sm text-black/80">{deletedName ? `${deletedName} has been removed.` : `Medication has been removed.`}</p>
          </div>
        ) : null}
        <header className="space-y-2">
          <h1 id="medications-title" className="text-4xl font-bold text-black tracking-tight">Manage Medications</h1>
          <p className="text-sm text-black/70">View your medication routines and related schedules.</p>
        </header>

        <div>
          <a
            href="/medications/add"
            className="inline-block px-4 py-2 border border-black rounded-md bg-black text-white hover:bg-black/90 text-sm font-medium"
          >
            Add medication
          </a>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-black/70">No medications are listed yet. This page will show the medications you choose to track.</p>
        ) : (
          <section className="space-y-4" aria-label="Medications list">
            {items.map((item) => (
              <div key={item.id} className="border border-black/10 rounded-xl p-4 bg-white flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-black">{item.name}</p>
                  <p className="text-sm text-black/70">Schedules: {item.schedulesCount}</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <Link href={`/medications/${item.id}`} className="underline">View details</Link>
                  <Link href={`/medications/${item.id}/edit`} className="underline">Edit</Link>
                  <Link href={`/medications/${item.id}/delete`} className="underline">Delete</Link>
                </div>
              </div>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
