import { NextResponse } from 'next/server';
import { getUserFromCookies } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { randomUUID } from 'crypto';
import path from 'path';
import { enforceRateLimit, readMultipart } from '@/lib/api-security';

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const VALID_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

export async function POST(req: Request) {
  try {
    const authUser = await getUserFromCookies();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Allow students, tutors, and admins to upload profile images
    const allowedRoles = ['student', 'tutor', 'admin'];
    if (!allowedRoles.includes(authUser.role)) {
      return NextResponse.json({ error: 'Unauthorized role' }, { status: 403 });
    }

    const limited = await enforceRateLimit(req, 'upload', 30, 60 * 60 * 1000, authUser.id);
    if (limited) return limited;

    const parsed = await readMultipart(req, MAX_SIZE + 64 * 1024);
    if ('response' in parsed) return parsed.response;
    const formData = parsed.formData;
    // Accept both 'image' (doubt upload) and 'file' (profile photo) field names
    const file = (formData.get('file') ?? formData.get('image')) as File | null;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    // Validate size
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 5MB limit' }, { status: 400 });
    }

    // Validate MIME type (using server-verified type, not client-provided filename)
    const ext = VALID_TYPES[file.type];
    if (!ext) {
      return NextResponse.json({ error: 'Invalid file type. Only JPG, PNG, WEBP, and GIF are allowed' }, { status: 400 });
    }

    const originalName = file.name;
    const originalExt = path.extname(originalName).toLowerCase();
    const acceptedExtensions = file.type === 'image/jpeg' ? ['.jpg', '.jpeg'] : [ext];
    if (!originalName || originalName.includes('..') || /[\\/\u0000-\u001f]/.test(originalName) || !acceptedExtensions.includes(originalExt)) {
      return NextResponse.json({ error: 'Filename extension does not match the image type.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const isPng = buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const isJpeg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isGif = buffer.length >= 6 && ['GIF87a', 'GIF89a'].includes(buffer.toString('ascii', 0, 6));
    const isWebp = buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
    const signatureMatches = file.type === 'image/png' ? isPng : file.type === 'image/jpeg' ? isJpeg : file.type === 'image/gif' ? isGif : isWebp;
    if (!signatureMatches) return NextResponse.json({ error: 'Image content does not match its declared type.' }, { status: 400 });

    // Generate safe filename — never use original filename from client
    const uniqueSuffix = randomUUID();
    const prefix = formData.get('file') ? 'avatar' : 'doubt';
    const filename = `${prefix}-${uniqueSuffix}${ext}`;

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    // Write to disk
    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    const url = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      url,          // profile pages use data.url
      imageUrl: url, // doubt upload uses data.imageUrl
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
