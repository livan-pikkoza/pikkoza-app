import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromCookies } from '@/lib/auth';
import { isApprovedTutor, tutorApprovalRequiredResponse } from '@/lib/tutor-auth';
import { enforceRateLimit, readJson } from '@/lib/api-security';

// PATCH /api/tutors/[id] - update tutor profile / availability / verification (admin)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await getUserFromCookies();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limited = await enforceRateLimit(req, authUser.role === 'admin' ? 'admin-mutation' : 'tutor-profile-mutation', authUser.role === 'admin' ? 60 : 30, 15 * 60 * 1000, authUser.id);
    if (limited) return limited;
    const parsed = await readJson<Record<string, any>>(req, 32 * 1024);
    if ('response' in parsed) return parsed.response;
    const body = parsed.data;
    const {
      isAvailableNow,
      weeklySlots,
      bio,
      institute,
      qualifications,
      experienceYears,
      hourlyRate,
      teachingSubjects,
      verificationStatus, // admin only
    } = body;

    const isAdmin = authUser.role === 'admin';
    const isSelf = authUser.id === id;

    if (!isAdmin && !isSelf) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (verificationStatus !== undefined && !['PENDING', 'APPROVED', 'REJECTED'].includes(String(verificationStatus).toUpperCase())) {
      return NextResponse.json({ error: 'Invalid verification status' }, { status: 400 });
    }

    const updatesPublicAvailability = isAvailableNow !== undefined
      || Array.isArray(weeklySlots)
      || hourlyRate !== undefined
      || teachingSubjects !== undefined;
    if (
      !isAdmin
      && isSelf
      && authUser.role === 'tutor'
      && updatesPublicAvailability
      && !(await isApprovedTutor(authUser.id))
    ) {
      return NextResponse.json(tutorApprovalRequiredResponse(), { status: 403 });
    }

    // Admin can update verificationStatus on User model
    if (isAdmin && verificationStatus) {
      const dbVerifStatus = verificationStatus.toUpperCase() as 'PENDING' | 'APPROVED' | 'REJECTED';
      if (dbVerifStatus === 'APPROVED' || dbVerifStatus === 'REJECTED') {
        await prisma.$transaction([
          prisma.user.update({
            where: { id },
            data: { verificationStatus: dbVerifStatus },
          }),
          prisma.tutorProfile.updateMany({
            where: { userId: id },
            data: { verificationStatus: dbVerifStatus },
          }),
        ]);
      } else {
        await prisma.user.update({
          where: { id },
          data: { verificationStatus: dbVerifStatus },
        });
      }
    }

    // Update TutorProfile fields
    const profileUpdates: Record<string, unknown> = {};
    if (isAvailableNow !== undefined) profileUpdates.isAvailableNow = isAvailableNow;
    if (bio !== undefined) profileUpdates.bio = bio;
    if (institute !== undefined) profileUpdates.institute = institute;
    if (qualifications !== undefined) profileUpdates.qualifications = qualifications;
    if (experienceYears !== undefined) profileUpdates.experienceYears = experienceYears;
    if (hourlyRate !== undefined) profileUpdates.hourlyRate = hourlyRate;
    if (teachingSubjects !== undefined) profileUpdates.teachingSubjects = teachingSubjects;

    if (Object.keys(profileUpdates).length > 0) {
      await prisma.tutorProfile.updateMany({
        where: { userId: id },
        data: profileUpdates,
      });
    }

    // Replace weekly slots if provided
    if (weeklySlots && Array.isArray(weeklySlots)) {
      const tutorProfile = await prisma.tutorProfile.findUnique({ where: { userId: id } });
      if (tutorProfile) {
        await prisma.availabilitySlot.deleteMany({ where: { tutorProfileId: tutorProfile.id } });
        await prisma.availabilitySlot.createMany({
          data: weeklySlots.map((slot: { day: string; startTime: string; endTime: string }) => ({
            tutorProfileId: tutorProfile.id,
            day: slot.day,
            startTime: slot.startTime,
            endTime: slot.endTime,
          })),
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('PATCH /api/tutors/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update tutor' }, { status: 500 });
  }
}
