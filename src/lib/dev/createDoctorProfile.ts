"use server";

import prisma from "@/lib/data/prisma";

export async function createDoctorProfileForUser(userId: string): Promise<{ ok: boolean; doctorProfileId?: string; error?: string }> {
  if (process.env.NODE_ENV === "production") {
    return { ok: false, error: "Not available in production" };
  }

  if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
    return { ok: false, error: "userId is required" };
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { ok: false, error: "User not found" };
    }

    const existing = await prisma.doctorProfile.findUnique({ where: { userId } });
    if (existing) {
      return { ok: true, doctorProfileId: existing.id };
    }

    const profile = await prisma.doctorProfile.create({
      data: { userId },
    });

    return { ok: true, doctorProfileId: profile.id };
  } catch (err) {
    return { ok: false, error: "Failed to create doctor profile" };
  }
}
