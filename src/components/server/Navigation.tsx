import Link from "next/link";
import { getCurrentUser } from "@/lib/server/auth";

export async function Navigation() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-black/10 bg-white text-black">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="text-sm font-semibold uppercase tracking-wide">
          <Link href="/" className="hover:underline">
            MedicaLog
          </Link>
        </div>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          <Link href="/medications" className="hover:underline">Manage Medications</Link>
          <Link href="/insights" className="hover:underline">Insights &amp; Awareness</Link>
          <Link href="/patient/doctor-access" className="hover:underline">Doctor Monitoring Access</Link>
          <Link href="/settings" className="hover:underline">Settings</Link>
        </nav>
      </div>
    </header>
  );
}
