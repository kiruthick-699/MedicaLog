import { requireUser } from "@/lib/server/auth";
import { getUserWithRelations, getMedicationWithSchedules } from "@/lib/data/persistence";
import Link from "next/link";
import SampleDataTable from "./SampleDataTable";

export default async function MedicationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const data = await getUserWithRelations(user.id);

  const medications = data?.medications ?? [];

  const items = await Promise.all(
    medications.map(async (m) => {
      const withSchedules = await getMedicationWithSchedules(m.id);
      return {
        id: m.id,
        name: m.name,
        schedulesCount: withSchedules?.schedules.length ?? 0,
        schedules: withSchedules?.schedules ?? [],
        createdAt: m.createdAt,
      };
    })
  );
  
  const resolvedSearchParams = await searchParams;
  const added = typeof resolvedSearchParams?.added === "string" ? resolvedSearchParams!.added : undefined;
  const deleted = typeof resolvedSearchParams?.deleted === "string" ? resolvedSearchParams!.deleted : undefined;
  const deletedNameParam = typeof resolvedSearchParams?.name === "string" ? resolvedSearchParams!.name : undefined;
  const addedName = added === "1" && deletedNameParam ? decodeURIComponent(deletedNameParam) : undefined;
  const deletedName = deleted === "1" && deletedNameParam ? decodeURIComponent(deletedNameParam) : undefined;

  return (
    <main className="min-h-screen bg-white" aria-labelledby="medications-title">
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-10">
        {added === "1" && addedName && (
          <div className="border border-green-200 bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-800 font-medium">✓ {addedName} created successfully</p>
          </div>
        )}
        {deleted === "1" && deletedName && (
          <div className="border border-black/10 rounded-lg p-4 bg-white">
            <p className="text-sm text-black/80">{deletedName} has been removed.</p>
          </div>
        )}
        
        <header className="space-y-2">
          <h1 id="medications-title" className="text-4xl font-bold text-black tracking-tight">Manage Medications</h1>
          <p className="text-sm text-black/70">View and manage your medication routines and schedules.</p>
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
          <div className="border border-black/10 rounded-xl p-12 bg-white text-center space-y-3">
            <div className="text-4xl text-black/20">💊</div>
            <p className="text-base font-semibold text-black/70">No medications added yet</p>
            <p className="text-sm text-black/50">Add your first medication to start tracking adherence.</p>
          </div>
        ) : (
          <section className="space-y-4" aria-label="Medications list">
            {items.map((item) => (
              <div key={item.id} className="border border-black/10 rounded-xl p-5 bg-white space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xl font-semibold text-black">{item.name}</p>
                    <p className="text-sm text-black/60">
                      {item.schedulesCount} schedule{item.schedulesCount !== 1 ? 's' : ''}
                    </p>
                    {item.schedules.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {item.schedules.map((s) => (
                          <span key={s.id} className="text-xs px-2 py-1 bg-black/5 text-black/70 rounded">
                            {s.timeSlot.charAt(0) + s.timeSlot.slice(1).toLowerCase()}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-black/50 mt-1">
                      Active since {item.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Link href={`/medications/${item.id}`} className="underline hover:text-black/70">View Details</Link>
                    <Link href={`/medications/${item.id}/edit`} className="underline hover:text-black/70">Edit</Link>
                    <Link href={`/medications/${item.id}/delete`} className="underline text-red-600 hover:text-red-700">Delete</Link>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        <SampleDataTable />
      </div>
    </main>
  );
}
