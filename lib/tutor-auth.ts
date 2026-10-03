import { prisma } from '@/lib/prisma';

/**
 * Checks the persisted tutor approval state for authorization decisions.
 * Both existing approval fields must be approved; the Admin approval flow
 * updates them together, and a mismatch fails closed.
 */
export async function isApprovedTutor(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      status: true,
      verificationStatus: true,
      tutorProfile: { select: { verificationStatus: true } },
    },
  });

  return user?.role === 'TUTOR'
    && user.status === 'ACTIVE'
    && user.verificationStatus === 'APPROVED'
    && user.tutorProfile?.verificationStatus === 'APPROVED';
}

export function tutorApprovalRequiredResponse() {
  return { error: 'Tutor approval required.' };
}
