import { requireUser } from "@/lib/server/auth";
import { getDiagnosedConditionById } from "@/lib/data/persistence";
import { notFound } from "next/navigation";
import { EditConditionForm } from "@/components/client/EditConditionForm";

export default async function EditConditionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await requireUser();
  const condition = await getDiagnosedConditionById(resolvedParams.id);

  if (!condition || condition.userId !== user.id) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white" aria-labelledby="edit-condition-title">
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <header className="space-y-2">
          <h1 id="edit-condition-title" className="text-4xl font-bold text-black tracking-tight">Edit condition</h1>
          <p className="text-sm text-black/70">Update the reference details for this diagnosed condition.</p>
        </header>

        <section className="border border-black/10 rounded-xl p-6 bg-white" aria-label="Edit condition form">
          <EditConditionForm
            conditionId={condition.id}
            initialName={condition.name}
            initialNote={condition.note || ""}
          />
        </section>
      </div>
    </main>
  );
}
