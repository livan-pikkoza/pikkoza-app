import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const MAX_JSON_BYTES = 64 * 1024;

export async function enforceRateLimit(request: Request, name: string, max: number, windowMs: number, actorId?: string) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',').map((part) => part.trim()).filter(Boolean);
  const ip = request.headers.get('x-real-ip')?.trim() || forwarded?.at(-1) || 'unknown';
  const identities = [ip, ...(actorId ? [`actor:${actorId}`] : [])];
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs);
  let exceeded = false;
  for (const identity of identities) {
    const key = `${name}:${createHash('sha256').update(identity).digest('hex')}`;
    const row = await prisma.apiRateLimitBucket.upsert({
      where: { key_windowStart: { key, windowStart } },
      create: { key, windowStart, count: 1 },
      update: { count: { increment: 1 } },
      select: { count: true },
    });
    if (row.count > max) exceeded = true;
  }
  if (Math.random() < 0.01) {
    void prisma.apiRateLimitBucket.deleteMany({ where: { windowStart: { lt: new Date(now - 24 * 60 * 60 * 1000) } } }).catch(() => {});
  }
  if (exceeded) {
    const retryAfter = Math.max(1, Math.ceil((windowStart.getTime() + windowMs - now) / 1000));
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429, headers: { 'Retry-After': String(retryAfter) } });
  }
  return null;
}

export async function readJson<T = Record<string, unknown>>(request: Request, maxBytes = MAX_JSON_BYTES): Promise<{ data: T } | { response: NextResponse }> {
  const type = request.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  if (type !== 'application/json') return { response: NextResponse.json({ error: 'Expected a JSON request body.' }, { status: 415 }) };
  const length = Number(request.headers.get('content-length'));
  if (Number.isFinite(length) && length > maxBytes) return { response: NextResponse.json({ error: 'Request body is too large.' }, { status: 413 }) };
  if (!request.body) return { response: NextResponse.json({ error: 'Invalid request body.' }, { status: 400 }) };
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return { response: NextResponse.json({ error: 'Request body is too large.' }, { status: 413 }) };
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const data = JSON.parse(new TextDecoder().decode(bytes)) as T;
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('invalid body');
    return { data };
  } catch {
    return { response: NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 }) };
  }
}

export async function readMultipart(request: Request, maxBytes: number): Promise<{ formData: FormData } | { response: NextResponse }> {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.toLowerCase().startsWith('multipart/form-data;')) return { response: NextResponse.json({ error: 'Expected a multipart upload.' }, { status: 415 }) };
  const length = Number(request.headers.get('content-length'));
  if (Number.isFinite(length) && length > maxBytes) return { response: NextResponse.json({ error: 'Upload request is too large.' }, { status: 413 }) };
  if (!request.body) return { response: NextResponse.json({ error: 'Invalid upload request.' }, { status: 400 }) };
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) { await reader.cancel(); return { response: NextResponse.json({ error: 'Upload request is too large.' }, { status: 413 }) }; }
      chunks.push(value);
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const formData = await new Response(bytes, { headers: { 'content-type': contentType } }).formData();
    return { formData };
  } catch {
    return { response: NextResponse.json({ error: 'Invalid upload request.' }, { status: 400 }) };
  }
}
