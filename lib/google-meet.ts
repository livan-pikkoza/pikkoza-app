import { google } from 'googleapis';
import { parseSessionStart } from '@/lib/session-time';
import { getOrganizerGoogleOAuthClient } from '@/lib/google-oauth';

interface CreateMeetEventParams {
  sessionId: string;
  subject: string;
  studentName: string;
  tutorName: string;
  date: string;
  time: string;
  durationMinutes: number;
}

type GoogleApiError = {
  code?: number | string;
  message?: string;
  response?: {
    status?: number;
    data?: {
      error?: {
        code?: number;
        message?: string;
        errors?: Array<{ reason?: string }>;
      };
    };
  };
};

export class GoogleMeetCreationError extends Error {
  constructor(
    message: string,
    public readonly httpStatus?: number,
    public readonly googleCode?: number | string,
    public readonly reason?: string,
    public readonly googleMessage?: string
  ) {
    super(message);
    this.name = 'GoogleMeetCreationError';
  }
}

function sanitizeGoogleMessage(message: unknown): string | undefined {
  if (typeof message !== 'string') return undefined;
  return message
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted account]')
    .replace(/Bearer\s+\S+/gi, 'Bearer [redacted]')
    .replace(/(client_secret|refresh_token|access_token|private_key)\s*[:=]\s*[^\s,;]+/gi, '$1=[redacted]')
    .replace(/[\r\n]+/g, ' ')
    .slice(0, 500);
}

function getSafeGoogleError(error: unknown) {
  const apiError = error as GoogleApiError;
  return {
    httpStatus: apiError.response?.status,
    googleCode: apiError.response?.data?.error?.code ?? apiError.code,
    reason: apiError.response?.data?.error?.errors?.[0]?.reason,
    message: sanitizeGoogleMessage(apiError.response?.data?.error?.message ?? apiError.message),
  };
}

function getMeetUrl(event: { hangoutLink?: string | null; conferenceData?: { entryPoints?: Array<{ entryPointType?: string | null; uri?: string | null }> | null } | null }) {
  const url = event.hangoutLink || event.conferenceData?.entryPoints?.find(
    (entryPoint) => entryPoint.entryPointType === 'video'
  )?.uri;
  return url && /^https:\/\/meet\.google\.com\/[a-z0-9-]+$/i.test(url) ? url : null;
}

export async function createGoogleMeetEvent(params: CreateMeetEventParams): Promise<string> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
  const auth = await getOrganizerGoogleOAuthClient();
  const calendar = google.calendar({ version: 'v3', auth });
  const startDate = parseSessionStart(params.date, params.time);
  if (!startDate) throw new GoogleMeetCreationError('Invalid session date or time.');

  const durationMinutes = Number.isInteger(params.durationMinutes) && params.durationMinutes > 0
    ? params.durationMinutes
    : 30;
  const eventId = params.sessionId.replace(/-/g, '').toLowerCase();
  let eventIdForCleanup: string | undefined;
  let mayDeleteEvent = false;

  try {
    let response;
    try {
      response = await calendar.events.insert({
        calendarId,
        conferenceDataVersion: 1,
        requestBody: {
          id: eventId,
          summary: `Pikkoza Session: ${params.subject}`,
          description: `1-on-1 Doubt Solving Session on Pikkoza\nStudent: ${params.studentName}\nTutor: ${params.tutorName}\nSubject: ${params.subject}`,
          start: {
            dateTime: startDate.toISOString(),
            timeZone: 'Asia/Kolkata',
          },
          end: {
            dateTime: new Date(startDate.getTime() + durationMinutes * 60000).toISOString(),
            timeZone: 'Asia/Kolkata',
          },
          conferenceData: {
            createRequest: {
              requestId: params.sessionId,
              conferenceSolutionKey: { type: 'hangoutsMeet' },
            },
          },
          extendedProperties: {
            private: { pikkozaSessionId: params.sessionId },
          },
        },
      });
      eventIdForCleanup = response.data.id || eventId;
      mayDeleteEvent = true;
    } catch (error) {
      const safeError = getSafeGoogleError(error);
      if (safeError.httpStatus !== 409) throw error;

      // A retry with the same Pikkoza session ID reuses its deterministic event.
      response = await calendar.events.get({ calendarId, eventId });
      if (response.data.extendedProperties?.private?.pikkozaSessionId !== params.sessionId) {
        throw new GoogleMeetCreationError('Google Calendar event ID collision.', 409, 409);
      }
    }

    let meetUrl = getMeetUrl(response.data);
    for (let attempt = 0; !meetUrl && attempt < 6; attempt += 1) {
      const requestStatus = response.data.conferenceData?.createRequest?.status?.statusCode;
      if (requestStatus === 'failure') break;
      await new Promise((resolve) => setTimeout(resolve, 1000));
      response = await calendar.events.get({ calendarId, eventId: response.data.id || eventId });
      meetUrl = getMeetUrl(response.data);
    }

    if (!meetUrl) {
      throw new GoogleMeetCreationError('Google Calendar did not return a valid Meet URL.');
    }

    return meetUrl;
  } catch (error) {
    if (eventIdForCleanup && mayDeleteEvent) {
      try {
        await calendar.events.delete({ calendarId, eventId: eventIdForCleanup });
      } catch (cleanupError) {
        const cleanupInfo = getSafeGoogleError(cleanupError);
        console.error('Google Calendar cleanup failed.', cleanupInfo);
      }
    }

    if (error instanceof GoogleMeetCreationError) throw error;
    const safeError = getSafeGoogleError(error);
    console.error('Google Calendar Meet event request failed.', safeError);
    throw new GoogleMeetCreationError(
      'Unable to create a Google Meet conference.',
      safeError.httpStatus,
      safeError.googleCode,
      safeError.reason,
      safeError.message
    );
  }
}
