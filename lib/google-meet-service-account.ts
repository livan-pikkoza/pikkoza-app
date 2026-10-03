import { google } from 'googleapis';
import { parseSessionStart } from '@/lib/session-time';

interface CreateMeetEventParams {
  sessionId: string;
  subject: string;
  studentName: string;
  tutorName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  durationMinutes: number;
}

/**
 * Server-only utility to create a real Google Meet link via Google Calendar API.
 * Uses Service Account credentials from environment variables.
 */
export async function createGoogleMeetEvent(params: CreateMeetEventParams): Promise<string> {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

  if (!clientEmail || !privateKey) {
    console.error('[Google Meet Error] Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY environment variables.');
    throw new Error('Google Meet service account configuration missing on server.');
  }

  // Handle escaped newlines (\n) in environment variable string
  privateKey = privateKey.replace(/\\n/g, '\n');

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    const startDate = parseSessionStart(params.date, params.time);
    if (!startDate) throw new Error('Invalid session date or time.');

    const durationMinutes = Number.isInteger(params.durationMinutes) && params.durationMinutes > 0
      ? params.durationMinutes
      : 30;
    const startTimeMs = startDate.getTime();
    const endTimeMs = startTimeMs + durationMinutes * 60 * 1000;

    const startISO = new Date(startTimeMs).toISOString();
    const endISO = new Date(endTimeMs).toISOString();

    let response = await calendar.events.insert({
      calendarId,
      conferenceDataVersion: 1,
      requestBody: {
        summary: `Pikkoza Session: ${params.subject}`,
        description: `1-on-1 Doubt Solving Session on Pikkoza\nStudent: ${params.studentName}\nTutor: ${params.tutorName}\nSubject: ${params.subject}`,
        start: {
          dateTime: startISO,
          timeZone: 'Asia/Kolkata',
        },
        end: {
          dateTime: endISO,
          timeZone: 'Asia/Kolkata',
        },
        conferenceData: {
          createRequest: {
            requestId: `pikkoza-session-${params.sessionId}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet',
            },
          },
        },
      },
    });

    let hangoutLink =
      response.data.hangoutLink ||
      response.data.conferenceData?.entryPoints?.find(
        (ep) => ep.entryPointType === 'video'
      )?.uri;

    // Calendar creates conference details asynchronously. Poll briefly for the
    // generated Meet URL before returning the booking response.
    for (let attempt = 0; !hangoutLink && response.data.id && attempt < 6; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      response = await calendar.events.get({ calendarId, eventId: response.data.id });
      hangoutLink =
        response.data.hangoutLink ||
        response.data.conferenceData?.entryPoints?.find(
          (ep) => ep.entryPointType === 'video'
        )?.uri;
      if (response.data.conferenceData?.createRequest?.status?.statusCode === 'failure') break;
    }

    if (!hangoutLink || !/^https:\/\/meet\.google\.com\//i.test(hangoutLink)) {
      console.error('[Google Meet Error] Calendar did not return a valid Google Meet URL.');
      throw new Error('Failed to generate Google Meet link from Google Calendar API.');
    }

    return hangoutLink;
  } catch (err: unknown) {
    const error = err as { message?: string; code?: number; status?: number; response?: { data?: unknown } };
    console.error('[Google Meet API Failure] Message:', error?.message);
    console.error('[Google Meet API Failure] Code:', error?.code || error?.status);
    if (error?.response?.data) {
      console.error('[Google Meet API Failure] Response:', JSON.stringify(error.response.data));
    }
    throw new Error('Unable to create the class meeting. Please try again.');
  }
}
