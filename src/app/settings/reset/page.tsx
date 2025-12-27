import { requireUser } from "@/lib/server/auth";
import { resetDataAction } from "@/lib/actions/account";
import ResetDataConfirm from "@/components/client/ResetDataConfirm";

export default async function ResetDataPage() {
  const user = await requireUser();

  const action = async (formData: FormData) => {
    "use server";
    await resetDataAction();
  };

  return (
    <main className="min-h-screen bg-white" aria-labelledby="reset-title">
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <header className="space-y-2">
          <h1 id="reset-title" className="text-4xl font-bold text-black tracking-tight">
            Reset onboarding
          </h1>
          <p className="text-sm text-black/70">
            Clear your medications, schedules, and diagnosed conditions to start over. Your account will remain.
          </p>
        </header>

        <section className="border border-black/10 rounded-xl p-6 bg-white space-y-6" aria-label="Reset confirmation">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-black">What will be removed</h2>
            <ul className="space-y-2 text-sm text-black/80">
              <li className="flex items-start gap-3">
                <span className="text-black/50 mt-1">•</span>
                <span>All medications</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-black/50 mt-1">•</span>
                <span>All medication schedules</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-black/50 mt-1">•</span>
                <span>All diagnosed conditions</span>
              </li>
            </ul>
          </div>

          <div className="space-y-4 pt-4 border-t border-black/10">
            <h2 className="text-lg font-semibold text-black">What will remain</h2>
            <ul className="space-y-2 text-sm text-black/80">
              <li className="flex items-start gap-3">
                <span className="text-black/50 mt-1">•</span>
                <span>Your account</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-black/50 mt-1">•</span>
                <span>Your login credentials</span>
              </li>
            </ul>
          </div>

          <div className="space-y-4 pt-6">
            <p className="text-sm text-black/70">
              After reset, you will be returned to the onboarding process. You can rebuild your medications and conditions at your own pace.
            </p>
            <ResetDataConfirm action={action} />
          </div>
        </section>
      </div>
    </main>
  );
}
