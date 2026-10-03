import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromCookies } from '@/lib/auth';
import { enforceRateLimit, readJson } from '@/lib/api-security';

// GET /api/profile - fetch current user's profile
export async function GET() {
  try {
    const authUser = await getUserFromCookies();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: { profile: true, tutorProfile: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || undefined,
        avatar: user.avatar || undefined,
        role: user.role.toLowerCase() as 'student' | 'tutor' | 'admin',
        status: user.status.toLowerCase() as 'active' | 'suspended',
        verificationStatus: (user.tutorProfile?.verificationStatus || user.verificationStatus || 'APPROVED').toLowerCase() as 'pending' | 'approved' | 'rejected',
        grade: user.profile?.grade || undefined,
        stream: user.profile?.stream || undefined,
        targetExam: user.profile?.targetExam || undefined,
        interestedSubjects: user.profile?.interestedSubjects || undefined,
        bio: user.tutorProfile?.bio || undefined,
        institute: user.tutorProfile?.institute || undefined,
        qualifications: user.tutorProfile?.qualifications || undefined,
        experienceYears: user.tutorProfile?.experienceYears || undefined,
        hourlyRate: user.tutorProfile?.hourlyRate || undefined,
        teachingSubjects: user.tutorProfile?.teachingSubjects || undefined,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('GET /api/profile error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

// PATCH /api/profile - update user's own profile
export async function PATCH(req: Request) {
  try {
    const authUser = await getUserFromCookies();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limited = await enforceRateLimit(req, 'profile-mutation', 30, 15 * 60 * 1000, authUser.id);
    if (limited) return limited;
    const parsed = await readJson<Record<string, any>>(req, 16 * 1024);
    if ('response' in parsed) return parsed.response;
    const body = parsed.data;
    const {
      name,
      phone,
      avatar,
      grade,
      stream,
      targetExam,
      interestedSubjects,
      bio,
      institute,
      qualifications,
      experienceYears,
      hourlyRate,
      teachingSubjects,
    } = body;

    // Update User model fields (name, phone, avatar)
    const userUpdates: Record<string, unknown> = {};
    if (name !== undefined) userUpdates.name = String(name).trim();
    if (phone !== undefined) userUpdates.phone = String(phone).trim();
    if (avatar !== undefined) userUpdates.avatar = String(avatar).trim();

    if (Object.keys(userUpdates).length > 0) {
      await prisma.user.update({
        where: { id: authUser.id },
        data: userUpdates,
      });
    }

    // Update student Profile
    if (authUser.role === 'student') {
      const profileUpdates: Record<string, unknown> = {};
      if (grade !== undefined) profileUpdates.grade = String(grade);
      if (stream !== undefined) profileUpdates.stream = String(stream);
      if (targetExam !== undefined) profileUpdates.targetExam = String(targetExam);
      if (Array.isArray(interestedSubjects)) profileUpdates.interestedSubjects = interestedSubjects;

      if (Object.keys(profileUpdates).length > 0) {
        await prisma.profile.upsert({
          where: { userId: authUser.id },
          update: profileUpdates,
          create: {
            userId: authUser.id,
            grade: grade ? String(grade) : 'Class 12',
            stream: stream ? String(stream) : 'PCM',
            targetExam: targetExam ? String(targetExam) : 'JEE Main & Advanced',
            interestedSubjects: Array.isArray(interestedSubjects) ? interestedSubjects : ['Physics', 'Mathematics'],
          },
        });
      }
    }

    // Update tutor Profile
    if (authUser.role === 'tutor') {
      const tutorUpdates: Record<string, unknown> = {};
      if (bio !== undefined) tutorUpdates.bio = String(bio);
      if (institute !== undefined) tutorUpdates.institute = String(institute);
      if (qualifications !== undefined) tutorUpdates.qualifications = String(qualifications);
      if (experienceYears !== undefined) tutorUpdates.experienceYears = Number(experienceYears);
      if (hourlyRate !== undefined) tutorUpdates.hourlyRate = Number(hourlyRate);
      if (Array.isArray(teachingSubjects)) tutorUpdates.teachingSubjects = teachingSubjects;

      if (Object.keys(tutorUpdates).length > 0) {
        await prisma.tutorProfile.upsert({
          where: { userId: authUser.id },
          update: tutorUpdates,
          create: {
            userId: authUser.id,
            bio: bio ? String(bio) : 'Expert educator.',
            institute: institute ? String(institute) : 'Premier Institute',
            qualifications: qualifications ? String(qualifications) : 'Expert Tutor',
            experienceYears: experienceYears ? Number(experienceYears) : 3,
            hourlyRate: hourlyRate ? Number(hourlyRate) : 199,
            teachingSubjects: Array.isArray(teachingSubjects) ? teachingSubjects : ['Physics', 'Mathematics'],
          },
        });
      }
    }

    // Fetch updated user object
    const updatedUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: { profile: true, tutorProfile: true },
    });

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone || undefined,
        avatar: updatedUser.avatar || undefined,
        role: updatedUser.role.toLowerCase() as 'student' | 'tutor' | 'admin',
        status: updatedUser.status.toLowerCase() as 'active' | 'suspended',
        verificationStatus: (updatedUser.tutorProfile?.verificationStatus || updatedUser.verificationStatus || 'APPROVED').toLowerCase() as 'pending' | 'approved' | 'rejected',
        grade: updatedUser.profile?.grade || undefined,
        stream: updatedUser.profile?.stream || undefined,
        targetExam: updatedUser.profile?.targetExam || undefined,
        interestedSubjects: updatedUser.profile?.interestedSubjects || undefined,
        bio: updatedUser.tutorProfile?.bio || undefined,
        institute: updatedUser.tutorProfile?.institute || undefined,
        qualifications: updatedUser.tutorProfile?.qualifications || undefined,
        experienceYears: updatedUser.tutorProfile?.experienceYears || undefined,
        hourlyRate: updatedUser.tutorProfile?.hourlyRate || undefined,
        teachingSubjects: updatedUser.tutorProfile?.teachingSubjects || undefined,
        createdAt: updatedUser.createdAt.toISOString(),
      },
    });
  } catch (error: unknown) {
    console.error('PATCH /api/profile error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
