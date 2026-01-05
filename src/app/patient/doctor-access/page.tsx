import { PendingRequestItem } from '@/components/client/PendingRequestItem';
import { ActiveAccessItem } from '@/components/client/ActiveAccessItem';
import {
  getPendingDoctorRequests,
  getActiveDoctorAccess,
  approveDoctorRequest,
  declineDoctorRequest,
  revokeDoctorAccess,
} from '@/lib/actions/patient-access';

export default async function DoctorAccessPage() {
  const pendingRequests = await getPendingDoctorRequests();
  const activeGrants = await getActiveDoctorAccess();

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-8">Doctor Monitoring Access</h1>

      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4">Pending Requests</h2>
        {pendingRequests.length === 0 ? (
          <p className="text-gray-500">No pending doctor access requests.</p>
        ) : (
          <div className="space-y-6">
            {pendingRequests.map((request) => (
              <PendingRequestItem
                key={request.id}
                request={{
                  id: request.id,
                  doctorId: request.doctorId,
                  createdAt: request.createdAt,
                }}
                onAllowMonitoring={approveDoctorRequest}
                onDeclineRequest={declineDoctorRequest}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Active Doctor Access</h2>
        {activeGrants.length === 0 ? (
          <p className="text-gray-500">No doctors currently have access to your data.</p>
        ) : (
          <div className="space-y-4">
            {activeGrants.map((grant) => (
              <ActiveAccessItem
                key={grant.grantId}
                grant={{
                  id: grant.grantId,
                  doctorId: grant.doctorId,
                  grantedAt: grant.grantedAt,
                }}
                onRevokeAccess={revokeDoctorAccess}
              />
            ))}
          </div>
        )}
      </section>

      <footer className="mt-8 pt-6 border-t text-xs text-gray-500 text-center">
        Medicalog does not provide medical advice. Doctors use this data independently outside the platform.
      </footer>
    </div>
  );
}
