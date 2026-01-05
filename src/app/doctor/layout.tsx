import { ReactNode } from 'react';
import Link from 'next/link';

interface DoctorLayoutProps {
  children: ReactNode;
}

export default function DoctorLayout({ children }: DoctorLayoutProps) {
  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-gray-800 text-white p-6">
        <nav className="space-y-4">
          <Link href="/doctor" className="block hover:text-gray-300">
            Dashboard
          </Link>
          <Link href="/doctor/patients" className="block hover:text-gray-300">
            Patients
          </Link>
          <Link href="/doctor/requests" className="block hover:text-gray-300">
            Requests
          </Link>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">
        {children}
        <footer className="p-4 text-xs text-gray-500 text-center border-t mt-8">
          This platform provides observational data only. Medical interpretation and consultation occur outside the system.
        </footer>
      </main>
    </div>
  );
}
