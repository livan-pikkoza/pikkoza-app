import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromCookies } from '@/lib/auth';
import { enforceRateLimit, readJson } from '@/lib/api-security';

// PATCH /api/users/[id] - Admin: toggle status, update verification
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await getUserFromCookies();
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const limited = await enforceRateLimit(req, 'admin-mutation', 60, 15 * 60 * 1000, authUser.id);
    if (limited) return limited;
    const parsed = await readJson<Record<string, any>>(req, 16 * 1024);
    if ('response' in parsed) return parsed.response;
    const body = parsed.data;
    const { status, verificationStatus } = body;

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { role: true },
    });
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (targetUser.role === 'ADMIN') {
      return NextResponse.json({ error: 'Admin accounts cannot be changed from user management' }, { status: 403 });
    }
    if (status && !['ACTIVE', 'SUSPENDED'].includes(String(status).toUpperCase())) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }
    if (verificationStatus && !['PENDING', 'APPROVED', 'REJECTED'].includes(String(verificationStatus).toUpperCase())) {
      return NextResponse.json({ error: 'Invalid verification status' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (status) {
      updateData.status = status.toUpperCase();
    }
    if (verificationStatus) {
      updateData.verificationStatus = verificationStatus.toUpperCase();
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Also sync verificationStatus to TutorProfile if applicable
    if (verificationStatus && updated.role === 'TUTOR') {
      await prisma.tutorProfile.updateMany({
        where: { userId: id },
        data: { verificationStatus: verificationStatus.toUpperCase() as 'PENDING' | 'APPROVED' | 'REJECTED' },
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role.toLowerCase(),
        status: updated.status.toLowerCase(),
        verificationStatus: updated.verificationStatus?.toLowerCase(),
      },
    });
  } catch (error: unknown) {
    console.error('PATCH /api/users/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
