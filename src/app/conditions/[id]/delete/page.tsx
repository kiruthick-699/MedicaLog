import { requireUser } from "@/lib/server/auth";
import { getDiagnosedConditionById } from "@/lib/data/persistence";
import { deleteConditionAction } from "@/lib/actions/conditions";
import { notFound, redirect } from "next/navigation";
import DeleteConditionConfirm from "@/components/client/DeleteConditionConfirm";

export default async function DeleteConditionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await requireUser();
  const condition = await getDiagnosedConditionById(resolvedParams.id);

  if (!condition || condition.userId !== user.id) {
    notFound();
  }

  const action = async (formData: FormData) => {
    "use server";
    const conditionId = String(formData.get("conditionId") || "");
    const result = await deleteConditionAction({ conditionId });
    if (!result.ok) {
      redirect(`/conditions/${condition.id}/delete?error=1`);
    }
  };

  return (
    <main className="min-h-screen bg-white" aria-labelledby="delete-condition-title">
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <header className="space-y-2">
          <h1 id="delete-condition-title" className="text-4xl font-bold text-black tracking-tight">Delete condition</h1>
          <p className="text-sm text-black/70">This will remove this diagnosed condition from your reference list. No medical advice is provided.</p>
        </header>

        <section className="border border-black/10 rounded-xl p-6 bg-white space-y-4" aria-label="Delete condition confirmation">
          <div className="space-y-1">
            <p className="text-sm text-black/70">Condition</p>
            <p className="text-lg font-semibold text-black">{condition.name}</p>
            {condition.note ? <p className="text-sm text-black/70">{condition.note}</p> : null}
          </div>

          <div className="flex items-center gap-6 pt-2">
            <DeleteConditionConfirm action={action} conditionId={condition.id} />
            <a href="/conditions" className="underline">Cancel</a>
          </div>
        </section>
      </div>
    </main>
  );
}
