import { PendingRequestItem } from '@/components/client/PendingRequestItem';
import { ActiveAccessItem } from '@/components/client/ActiveAccessItem';
import { DoctorDiscovery } from '@/components/client/DoctorDiscovery';
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
    <div className="max-w-4xl mx-auto p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">Doctor Monitoring Access</h1>
        <p className="text-sm text-black/70">
          Manage healthcare professional access to your adherence and wellness awareness data.
        </p>
      </header>

      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4 text-black">Pending Requests</h2>
        {pendingRequests.length === 0 ? (
          <p className="text-sm text-black/60">No pending doctor access requests.</p>
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

      <DoctorDiscovery />

      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4 text-black">Active Doctor Access</h2>
        {activeGrants.length === 0 ? (
          <p className="text-sm text-black/60">No doctors currently have access to your data.</p>
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

      <footer className="mt-8 pt-6 border-t border-black/10 text-sm text-black/60 text-center">
        MedicaLog provides awareness data only and does not offer medical advice. Healthcare professionals interpret data independently outside the platform.
      </footer>
    </div>
  );
}
