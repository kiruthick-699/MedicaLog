import Link from 'next/link';

async function getConsentedPatients() {
  'use server';
  
  // TODO: Fetch patients with active consent grants from database
  return [];
}

export default async function DoctorPatientsPage() {
  const patients = await getConsentedPatients();

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
              <th className="text-left p-4">Consent Granted</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient: any) => (
              <tr key={patient.id} className="border-b hover:bg-gray-50">
                <td className="p-4">{patient.name || patient.id}</td>
                <td className="p-4">
                  {new Date(patient.consentGrantedAt).toLocaleDateString()}
                </td>
                <td className="p-4">
                  <Link
                    href={`/doctor/patients/${patient.id}/logs`}
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
