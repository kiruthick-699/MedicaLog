import { requireDoctor } from "@/lib/server/auth";
import prisma from "@/lib/data/prisma";
import { AuthError } from "@/lib/errors";

interface PageProps {
  params: Promise<{
    patientId: string;
  }>;
}

async function validateDoctorAccess(patientId: string): Promise<{ hasAccess: boolean; status: "REVOKED" | "NO_CONSENT" | null }> {
  const { doctorProfile } = await requireDoctor();

  const grant = await prisma.doctorAccessGrant.findUnique({
    where: {
      doctorId_patientId: {
        doctorId: doctorProfile.id,
        patientId,
      },
    },
  });

  if (!grant) {
    return { hasAccess: false, status: "NO_CONSENT" };
  }

  if (grant.revokedAt !== null) {
    return { hasAccess: false, status: "REVOKED" };
  }

  return { hasAccess: true, status: null };
}

async function getMedicationAdherenceLogs(patientId: string) {
  const { doctorProfile } = await requireDoctor();

  const grant = await prisma.doctorAccessGrant.findUnique({
    where: {
      doctorId_patientId: {
        doctorId: doctorProfile.id,
        patientId,
      },
    },
  });

  if (!grant || grant.revokedAt !== null) {
    throw new AuthError("Access denied");
  }

  const logs = await prisma.medicationIntakeLog.findMany({
    where: { userId: patientId },
    include: {
      medication: { select: { name: true } },
      schedule: { select: { timeSlot: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const totalScheduled = logs.length;
  const totalTaken = logs.filter((log) => log.status === "TAKEN").length;
  const totalMissed = logs.filter((log) => log.status === "MISSED").length;

  return {
    logs: logs.map((log) => ({
      id: log.id,
      medicationName: log.medication.name,
      scheduledTime: log.logDate,
      timeSlot: log.schedule.timeSlot,
      actualIntakeTime: log.actualTime,
      status: log.status,
      observation: log.observation,
    })),
    metrics: {
      totalScheduled,
      totalTaken,
      totalMissed,
    },
  };
}

async function getPatientMedications(patientId: string) {
  const { doctorProfile } = await requireDoctor();

  const grant = await prisma.doctorAccessGrant.findUnique({
    where: {
      doctorId_patientId: {
        doctorId: doctorProfile.id,
        patientId,
      },
    },
  });

  if (!grant || grant.revokedAt !== null) {
    throw new AuthError("Access denied");
  }

  const medications = await prisma.medication.findMany({
    where: { userId: patientId },
    include: {
      schedules: true,
    },
    orderBy: { name: "asc" },
  });

  return medications.map((med) => ({
    id: med.id,
    name: med.name,
    schedules: med.schedules.map((s) => ({
      id: s.id,
      timeSlot: s.timeSlot,
      frequency: s.frequency,
      timing: s.timing,
    })),
  }));
}

export default async function PatientLogsPage({ params }: PageProps) {
  const { patientId } = await params;
  
  const accessResult = await validateDoctorAccess(patientId);
  
  if (!accessResult.hasAccess) {
    return (
      <div className="p-8">
        <p className="text-red-600">
          {accessResult.status === 'REVOKED'
            ? "Access to this patient's data has been revoked."
            : "Access denied. No active consent from this patient."}
        </p>
      </div>
    );
  }

  const { logs, metrics } = await getMedicationAdherenceLogs(patientId);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Medicmetrics.totalScheduled}</div>
            </div>
            <div className="border rounded p-4">
              <div className="text-sm text-gray-600">Total Taken</div>
              <div className="text-2xl font-bold">{metrics.totalTaken}</div>
            </div>
            <div className="border rounded p-4">
              <div className="text-sm text-gray-600">Total Missed</div>
              <div className="text-2xl font-bold">{metrics.">Total Scheduled</div>
              <div className="text-2xl font-bold">{totalScheduled}</div>
            </div>
            <div className="border rounded p-4">
              <div className="text-sm text-gray-600">Total Taken</div>
              <div className="text-2xl font-bold">{totalTaken}</div>
            </div>
            <div className="border rounded p-4">
              <div className="text-sm text-gray-600">Total Missed</div>
              <div className="text-2xl font-bold">{totalMissed}</div>
            </div>
          </div>

          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4">Medication</th>
                <th className="text-left p-4">Scheduled Time</th>
                <th className="text-left p-4">Actual Intake Time</th>
                <th className="text-left p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log: any) => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">{log.medicationName}</td>
                  <td className="p-4">
                    {new Date(log.scheduledTime).toLocaleString()}
                  </td>
                  <td className="p-4">
                    {log.actualIntakeTime 
                      ? new Date(log.actualIntakeTime).toLocaleString()
                      : '-'}
                  </td>
                  <td className="p-4">{log.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
