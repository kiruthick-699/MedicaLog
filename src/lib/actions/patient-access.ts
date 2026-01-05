"use server";

import { requireUser } from "@/lib/server/auth";
import prisma from "@/lib/data/prisma";
import { mapToSafeError } from "@/lib/errors";

export interface PendingDoctorRequestData {
  id: string;
  doctorId: string;
  createdAt: Date;
}

export async function getPendingDoctorRequests(): Promise<PendingDoctorRequestData[]> {
  const user = await requireUser({ onFail: "throw" });

  const requests = await prisma.doctorAccessRequest.findMany({
    where: {
      patientId: user.id,
      status: "PENDING",
    },
    orderBy: { createdAt: "desc" },
  });

  return requests.map((r) => ({
    id: r.id,
    doctorId: r.doctorId,
    createdAt: r.createdAt,
  }));
}

export interface ApproveRequestResult {
  ok: boolean;
  errors?: string[];
}

export async function approveDoctorRequest(requestId: string): Promise<ApproveRequestResult> {
  const user = await requireUser({ onFail: "throw" });

  if (!requestId || typeof requestId !== "string" || requestId.trim().length === 0) {
    return { ok: false, errors: ["Request ID is required"] };
  }

  try {
    const request = await prisma.doctorAccessRequest.findUnique({
      where: { id: requestId },
      include: { doctor: true },
    });

    if (!request) {
      return { ok: false, errors: ["Request not found"] };
    }

    if (request.patientId !== user.id) {
      return { ok: false, errors: ["Not authorized to approve this request"] };
    }

    if (request.status !== "PENDING") {
      return { ok: false, errors: ["Request is no longer pending"] };
    }

    if (request.doctor.userId === user.id) {
      return { ok: false, errors: ["Cannot approve your own request"] };
    }

    await prisma.$transaction(async (tx) => {
      await tx.doctorAccessGrant.upsert({
        where: {
          doctorId_patientId: {
            doctorId: request.doctorId,
            patientId: user.id,
          },
        },
        create: {
          doctorId: request.doctorId,
          patientId: user.id,
          revokedAt: null,
        },
        update: {
          revokedAt: null,
        },
      });

      await tx.doctorAccessRequest.delete({
        where: { id: requestId },
      });
    });

    return { ok: true };
  } catch (err) {
    const safe = mapToSafeError(err, "Failed to approve request");
    return { ok: false, errors: [safe.message] };
  }
}

export interface DeclineRequestResult {
  ok: boolean;
  errors?: string[];
}

export async function declineDoctorRequest(requestId: string): Promise<DeclineRequestResult> {
  const user = await requireUser({ onFail: "throw" });

  if (!requestId || typeof requestId !== "string" || requestId.trim().length === 0) {
    return { ok: false, errors: ["Request ID is required"] };
  }

  try {
    const request = await prisma.doctorAccessRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return { ok: false, errors: ["Request not found"] };
    }

    if (request.patientId !== user.id) {
      return { ok: false, errors: ["Not authorized to decline this request"] };
    }

    if (request.status !== "PENDING") {
      return { ok: false, errors: ["Request is no longer pending"] };
    }

    await prisma.doctorAccessRequest.update({
      where: { id: requestId },
      data: { status: "DECLINED" },
    });

    return { ok: true };
  } catch (err) {
    const safe = mapToSafeError(err, "Failed to decline request");
    return { ok: false, errors: [safe.message] };
  }
}

export interface RevokeAccessResult {
  ok: boolean;
  errors?: string[];
}

export async function revokeDoctorAccess(grantId: string): Promise<RevokeAccessResult> {
  const user = await requireUser({ onFail: "throw" });

  if (!grantId || typeof grantId !== "string" || grantId.trim().length === 0) {
    return { ok: false, errors: ["Grant ID is required"] };
  }

  try {
    const grant = await prisma.doctorAccessGrant.findUnique({
      where: { id: grantId },
    });

    if (!grant) {
      return { ok: false, errors: ["Access grant not found"] };
    }

    if (grant.patientId !== user.id) {
      return { ok: false, errors: ["Not authorized to revoke this access"] };
    }

    if (grant.revokedAt) {
      return { ok: false, errors: ["Access already revoked"] };
    }

    await prisma.doctorAccessGrant.update({
      where: { id: grantId },
      data: { revokedAt: new Date() },
    });

    return { ok: true };
  } catch (err) {
    const safe = mapToSafeError(err, "Failed to revoke access");
    return { ok: false, errors: [safe.message] };
  }
}

export interface ActiveDoctorAccessData {
  grantId: string;
  doctorId: string;
  grantedAt: Date;
}

export async function getActiveDoctorAccess(): Promise<ActiveDoctorAccessData[]> {
  const user = await requireUser({ onFail: "throw" });

  const grants = await prisma.doctorAccessGrant.findMany({
    where: {
      patientId: user.id,
      revokedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  return grants.map((g) => ({
    grantId: g.id,
    doctorId: g.doctorId,
    grantedAt: g.createdAt,
  }));
}
