import { requireUser } from "@/lib/server/auth";
import { deleteAccountAction } from "@/lib/actions/account";
import DeleteAccountConfirm from "@/components/client/DeleteAccountConfirm";

export default async function DeleteAccountPage() {
  const user = await requireUser();

  const action = async (formData: FormData) => {
    "use server";
    await deleteAccountAction();
  };

  return (
    <main className="min-h-screen bg-white" aria-labelledby="delete-account-title">
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <header className="space-y-2">
          <h1 id="delete-account-title" className="text-4xl font-bold text-black tracking-tight">
            Delete account
          </h1>
          <p className="text-sm text-black/70">
            This action is permanent. Your account and all associated data will be deleted and cannot be recovered.
          </p>
        </header>

        <section className="border border-red-600/20 rounded-xl p-6 bg-white space-y-6" aria-label="Delete account confirmation">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-black">What will be deleted</h2>
            <ul className="space-y-2 text-sm text-black/80">
              <li className="flex items-start gap-3">
                <span className="text-black/50 mt-1">•</span>
                <span>Your account</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-black/50 mt-1">•</span>
                <span>Your login credentials</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-black/50 mt-1">•</span>
                <span>All medications and schedules</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-black/50 mt-1">•</span>
                <span>All diagnosed conditions</span>
              </li>
            </ul>
          </div>

          <div className="space-y-4 pt-4 border-t border-black/10">
            <h2 className="text-lg font-semibold text-black">This cannot be undone</h2>
            <p className="text-sm text-black/80">
              Once your account is deleted, there is no way to recover it or any associated data. Please ensure you have backed up any information you need before proceeding.
            </p>
          </div>

          <div className="space-y-4 pt-6">
            <p className="text-sm text-black/70">
              If you prefer to keep your account but clear your data, consider using the reset onboarding option instead.
            </p>
            <DeleteAccountConfirm action={action} />
          </div>
        </section>
      </div>
    </main>
  );
}
