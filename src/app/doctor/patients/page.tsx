import Link from 'next/link';
import { getMyConsentedPatients } from '@/lib/actions/doctor';

export default async function DoctorPatientsPage() {
  const patients = await getMyConsentedPatients();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Consented Patients</h1>
      
      {patients.length === 0 ? (
        <p className="text-gray-500">No patients with active consent found.</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4">Patient</th>
              <th className="text-left p-4">Access Granted</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => (
              <tr key={patient.grantId} className="border-b hover:bg-gray-50">
                <td className="p-4">{patient.patientId}</td>
                <td className="p-4">
                  {new Date(patient.grantedAt).toLocaleDateString()}
                </td>
                <td className="p-4">
                  <Link
                    href={`/doctor/patients/${patient.patientId}`}
                    className="text-blue-600 hover:underline"
                  >
                    View Logs
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
