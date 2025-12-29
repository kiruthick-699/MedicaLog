import "dotenv/config";
import prisma from "@/lib/data/prisma";

async function verify() {
  const mockUser = await prisma.account.findFirst({
    where: {
      provider: "mock",
      providerAccountId: "demo@mock.local",
    },
    include: {
      user: {
        include: {
          medications: true,
          intakeLogs: true,
          snapshots: true,
        },
      },
    },
  });

  if (!mockUser) {
    console.log("❌ Mock user not found");
    process.exit(1);
  }

  const user = mockUser.user;
  console.log("✓ Mock user found");
  console.log(`  User ID: ${user.id}`);
  console.log(`  Medications: ${user.medications.length}`);
  console.log(`  Intake logs: ${user.intakeLogs.length}`);
  console.log(`  Snapshots: ${user.snapshots.length}`);

  // Show medication details
  for (const med of user.medications) {
    const schedules = await prisma.medicationSchedule.findMany({
      where: { medicationId: med.id },
    });
    console.log(`  - ${med.name}: ${schedules.length} schedules`);
    for (const sched of schedules) {
      console.log(`    * ${sched.timeSlot}`);
    }
  }

  // Show recent logs
  const recentLogs = await prisma.medicationIntakeLog.findMany({
    where: { userId: user.id },
    orderBy: { logDate: "desc" },
    take: 5,
  });
  console.log("\nRecent intake logs (5 most recent):");
  for (const log of recentLogs) {
    console.log(`  ${log.logDate}: ${log.status} (${log.observation || "no note"})`);
  }

  // Show snapshot
  if (user.snapshots.length > 0) {
    const snap = user.snapshots[0];
    console.log(`\nLatest snapshot: ${snap.id}`);
    console.log(`  Adherence score: ${snap.adherenceScore}`);
    console.log(`  Signals detected: ${snap.signalCount}`);
  }
}

verify().then(() => process.exit(0)).catch(err => {
  console.error("Verification failed:", err);
  process.exit(1);
});
