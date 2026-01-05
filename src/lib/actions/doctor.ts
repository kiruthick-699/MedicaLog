"use server";

import { requireDoctor } from "@/lib/server/auth";
import prisma from "@/lib/data/prisma";
import { mapToSafeError } from "@/lib/errors";

export interface RequestAccessResult {
  ok: boolean;
  errors?: string[];
}

export async function requestAccessToPatient(patientEmail: string): Promise<RequestAccessResult> {
  const { doctorProfile } = await requireDoctor();

  if (!patientEmail || typeof patientEmail !== "string" || patientEmail.trim().length === 0) {
    return { ok: false, errors: ["Patient email is required"] };
  }

  const trimmedEmail = patientEmail.trim().toLowerCase();

  try {
    const patientAccount = await prisma.account.findFirst({
      where: {
        providerAccountId: trimmedEmail,
      },
      select: { userId: true },
    });

    if (!patientAccount) {
      return { ok: false, errors: ["No patient found with that email"] };
    }

    const patientId = patientAccount.userId;

    if (patientId === doctorProfile.userId) {
      return { ok: false, errors: ["Cannot request access to yourself"] };
    }

    const existingGrant = await prisma.doctorAccessGrant.findUnique({
      where: {
        doctorId_patientId: {
          doctorId: doctorProfile.id,
          patientId,
        },
      },
    });

    if (existingGrant && !existingGrant.revokedAt) {
      return { ok: false, errors: ["You already have access to this patient"] };
    }

    await prisma.doctorAccessRequest.create({
      data: {
        doctorId: doctorProfile.id,
        patientId,
        status: "PENDING",
      },
    });

    return { ok: true };
  } catch (err: any) {
    if (err?.code === "P2002") {
      return { ok: false, errors: ["Access request already exists for this patient"] };
    }
    const safe = mapToSafeError(err, "Failed to create access request");
    return { ok: false, errors: [safe.message] };
  }
}

export interface AccessRequestData {
  id: string;
  patientId: string;
  status: "PENDING" | "DECLINED";
  createdAt: Date;
}

export async function getMyAccessRequests(): Promise<AccessRequestData[]> {
  const { doctorProfile } = await requireDoctor();

  const requests = await prisma.doctorAccessRequest.findMany({
    where: { doctorId: doctorProfile.id },
    orderBy: { createdAt: "desc" },
  });

  return requests.map((r) => ({
    id: r.id,
    patientId: r.patientId,
    status: r.status,
    createdAt: r.createdAt,
  }));
}

export interface ConsentedPatientData {
  grantId: string;
  patientId: string;
  grantedAt: Date;
}

export async function getMyConsentedPatients(): Promise<ConsentedPatientData[]> {
  const { doctorProfile } = await requireDoctor();

  const grants = await prisma.doctorAccessGrant.findMany({
    where: {
      doctorId: doctorProfile.id,
      revokedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  return grants.map((g) => ({
    grantId: g.id,
    patientId: g.patientId,
    grantedAt: g.createdAt,
  }));
}
