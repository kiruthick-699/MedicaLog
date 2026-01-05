import { requireDoctor } from "@/lib/server/auth";
import prisma from "@/lib/data/prisma";
import { AuthError } from "@/lib/errors";

interface PageProps {
  params: Promise<{
    patientId: string;
  }>;
}

async function assertDoctorHasAccess(doctorProfileId: string, patientId: string): Promise<void> {
  const grant = await prisma.doctorAccessGrant.findUnique({
    where: {
      doctorId_patientId: {
        doctorId: doctorProfileId,
        patientId,
      },
    },
  });

  if (!grant) {
    throw new AuthError("No consent from this patient");
  }

  if (grant.revokedAt !== null) {
    throw new AuthError("Access has been revoked");
  }
}

async function validateDoctorAccess(patientId: string): Promise<{ hasAccess: boolean; status: "REVOKED" | "NO_CONSENT" | null }> {
  const { doctorProfile } = await requireDoctor();

  try {
    await assertDoctorHasAccess(doctorProfile.id, patientId);
    return { hasAccess: true, status: null };
  } catch (err) {
    if (err instanceof AuthError) {
      if (err.message.includes("revoked")) {
        return { hasAccess: false, status: "REVOKED" };
      }
      return { hasAccess: false, status: "NO_CONSENT" };
    }
    throw err;
  }
}

async function getMedicationAdherenceLogs(patientId: string) {
  const { doctorProfile } = await requireDoctor();
  await assertDoctorHasAccess(doctorProfile.id, patientId);

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
  await assertDoctorHasAccess(doctorProfile.id, patientId);

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

  const [{ logs, metrics }, medications] = await Promise.all([
    getMedicationAdherenceLogs(patientId),
    getPatientMedications(patientId),
  ]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Patient Overview</h1>

      {/* Medications Section */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Medications & Schedules</h2>
        {medications.length === 0 ? (
          <p className="text-gray-500">No medications on record.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {medications.map((med) => (
              <div key={med.id} className="border rounded-lg p-4 bg-white shadow-sm">
                <h3 className="font-medium text-lg mb-2">{med.name}</h3>
                {med.schedules.length === 0 ? (
                  <p className="text-sm text-gray-400">No schedules</p>
                ) : (
                  <ul className="space-y-1">
                    {med.schedules.map((schedule) => (
                      <li key={schedule.id} className="text-sm text-gray-600">
                        <span className="font-medium">{schedule.timeSlot}</span>
                        {" · "}
                        <span>{schedule.frequency}</span>
                        {schedule.timing && (
                          <span className="text-gray-400"> ({schedule.timing})</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Adherence Logs Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Adherence Summary</h2>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="border rounded p-4">
            <div className="text-sm text-gray-600">Total Scheduled</div>
            <div className="text-2xl font-bold">{metrics.totalScheduled}</div>
          </div>
          <div className="border rounded p-4">
            <div className="text-sm text-gray-600">Total Taken</div>
            <div className="text-2xl font-bold">{metrics.totalTaken}</div>
          </div>
          <div className="border rounded p-4">
            <div className="text-sm text-gray-600">Total Missed</div>
            <div className="text-2xl font-bold">{metrics.totalMissed}</div>
          </div>
        </div>
      </section>

      {/* Intake History Section - Grouped by Date */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold mb-4">Intake History</h2>

        {logs.length === 0 ? (
          <p className="text-gray-500">No intake logs recorded yet.</p>
        ) : (
          <div className="space-y-6">
            {(() => {
              // Group logs by date
              const grouped = logs.reduce((acc, log) => {
                const dateKey = new Date(log.scheduledTime).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                });
                if (!acc[dateKey]) acc[dateKey] = [];
                acc[dateKey].push(log);
                return acc;
              }, {} as Record<string, typeof logs>);

              return Object.entries(grouped).map(([date, dateLogs]) => (
                <div key={date} className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-4 py-2 font-medium text-gray-700">
                    {date}
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3 text-sm font-medium text-gray-600">Medication</th>
                        <th className="text-left p-3 text-sm font-medium text-gray-600">Schedule Slot</th>
                        <th className="text-left p-3 text-sm font-medium text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dateLogs.map((log) => (
                        <tr key={log.id} className="border-b last:border-b-0 hover:bg-gray-50">
                          <td className="p-3">{log.medicationName}</td>
                          <td className="p-3">{log.timeSlot}</td>
                          <td className="p-3">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                log.status === "TAKEN"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ));
            })()}
          </div>
        )}
      </section>
    </div>
  );
}
