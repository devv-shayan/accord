import { authorizedGoogleClient, calendarFailure } from "./auth";
import type { CalendarMeeting, CaptureUser } from "./types";

export function meetAddress(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "meet.google.com" && /^\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/.test(url.pathname)
      ? `https://meet.google.com${url.pathname}` : null;
  } catch { return null; }
}
interface CalendarEvent {
  id: string; summary?: string; status?: string; start?: { dateTime?: string }; end?: { dateTime?: string };
  hangoutLink?: string; location?: string; conferenceData?: { entryPoints?: Array<{ entryPointType: string; uri: string }> };
  attendees?: Array<{ displayName?: string; email?: string; responseStatus?: string; self?: boolean }>;
}
export function calendarEvents(events: CalendarEvent[]): CalendarMeeting[] {
  return events.flatMap((event) => {
    const url = meetAddress(event.hangoutLink) || meetAddress(event.conferenceData?.entryPoints?.find((point) => point.entryPointType === "video")?.uri) ||
      meetAddress(event.location?.match(/https:\/\/meet\.google\.com\/[a-z-]+/)?.[0]);
    if (!url || !event.start?.dateTime || !event.end?.dateTime || !Number.isFinite(Date.parse(event.start.dateTime)) ||
      !Number.isFinite(Date.parse(event.end.dateTime)) || Date.parse(event.end.dateTime) <= Date.parse(event.start.dateTime) ||
      event.status === "cancelled" || event.attendees?.some(attendee => attendee.self && attendee.responseStatus === "declined")) return [];
    return [{ id: event.id, title: event.summary?.slice(0, 160) || "Google Meet", startsAt: event.start.dateTime, endsAt: event.end.dateTime, meetUrl: url,
      participants: (event.attendees || []).filter((attendee) => attendee.responseStatus !== "declined").map((attendee) => attendee.displayName || attendee.email || "Participant").slice(0, 100) }];
  });
}
export async function upcomingMeetings(user: CaptureUser, origin: string) {
  const client = await authorizedGoogleClient(user, origin);
  const now = Date.now();
  const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
  url.search = new URLSearchParams({ timeMin: new Date(now - 4 * 3600_000).toISOString(), timeMax: new Date(now + 7 * 86400_000).toISOString(),
    singleEvents: "true", orderBy: "startTime", maxResults: "250", fields: "items(id,summary,status,start,end,hangoutLink,conferenceData,location,attendees),nextPageToken" }).toString();
  const events: CalendarEvent[] = [];
  try {
    for (let page = 0; page < 4; page++) {
      const { data } = await client.request<{ items?: CalendarEvent[]; nextPageToken?: string }>({ url: url.toString(), timeout: 15_000 });
      events.push(...(data.items || []));
      if (!data.nextPageToken) break;
      url.searchParams.set("pageToken", data.nextPageToken);
    }
  } catch (error) {
    return calendarFailure(user, error);
  }
  const meetings = calendarEvents(events).filter(meeting => Date.parse(meeting.endsAt) > now);
  return [...new Map(meetings.map(meeting => [meeting.id, meeting])).values()].sort((a,b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
}
