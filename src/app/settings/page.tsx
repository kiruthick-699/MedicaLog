import { getCurrentUser } from "@/lib/server/auth";
import { logoutAction } from "@/lib/actions/auth";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  return (
    <main className="min-h-screen bg-white" aria-labelledby="settings-title">
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">
        <header className="space-y-2">
          <h1 id="settings-title" className="text-4xl font-bold text-black">Settings</h1>
          <p className="text-sm text-black/70">Manage your account and data.</p>
        </header>

        <section className="space-y-3 border border-black/10 rounded-xl p-6 bg-white" aria-label="Account Information">
          <h2 className="text-xl font-semibold text-black">Account Information</h2>
          {user ? (
            <div className="text-sm text-black/80 space-y-1">
              <p><span className="font-semibold">User ID:</span> {user.id}</p>
              <p><span className="font-semibold">Created:</span> {user.createdAt.toLocaleString()}</p>
            </div>
          ) : (
            <p className="text-sm text-black/70">Not signed in.</p>
          )}
        </section>

        <section className="space-y-3 border border-black/10 rounded-xl p-6 bg-white" aria-label="Add Medication">
          <h2 className="text-xl font-semibold text-black">Add medication</h2>
          <p className="text-sm text-black/70">
            Add a new medication to your tracking list. You can manage schedules and details after adding.
          </p>
          <div>
            <a
              href="/medications/add"
              className="inline-block px-4 py-2 border border-black rounded-md bg-black text-white hover:bg-black/90 text-sm font-medium"
            >
              Add medication
            </a>
          </div>
        </section>

        <section className="space-y-3 border border-black/10 rounded-xl p-6 bg-white" aria-label="Reset Onboarding / Wipe Data">
          <h2 className="text-xl font-semibold text-black">Reset onboarding</h2>
          <p className="text-sm text-black/70">
            This will remove all medications, schedules, and diagnosed conditions. Your account will remain, and you will be returned to onboarding.
          </p>
          <div>
            <a
              href="/settings/reset"
              className="inline-block px-4 py-2 border border-black rounded-md text-black hover:bg-black/5 text-sm font-medium"
            >
              Reset my data
            </a>
          </div>
        </section>

        <section className="space-y-3 border border-red-600/20 rounded-xl p-6 bg-white" aria-label="Delete Account">
          <h2 className="text-xl font-semibold text-black">Delete account</h2>
          <p className="text-sm text-black/70">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <div>
            <a
              href="/settings/delete"
              className="inline-block px-4 py-2 border border-red-600 rounded-md bg-red-600 text-white hover:bg-red-700 text-sm font-medium"
            >
              Delete my account
            </a>
          </div>
        </section>

        <section className="space-y-3" aria-label="Logout">
          <h2 className="text-lg font-semibold text-black">Logout</h2>
          <p className="text-sm text-black/70">Sign out from this device.</p>
          <form action={logoutAction}>
            <button
              type="submit"
              className="px-4 py-2 border border-black/30 text-black/70 hover:text-black rounded-md text-sm font-medium"
            >
              Logout
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
