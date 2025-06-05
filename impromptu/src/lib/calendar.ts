import {
    google
} from "googleapis"
import { env } from "@/env";
import {z} from "zod"

// const oauth2Client = new google.auth.OAuth2(
//     env.GOOGLE_CLIENT_ID,
//     env.GOOGLE_CLIENT_SECRET
// );

// oauth2Client.setCredentials(
//     {
//         access_token: '' //need to add access token here, get it from getSession() probably.
//     }
// )
function toGoogleCalendarFormat(event: z.infer<typeof calendarSchema>) { //a slightly different format is expected by the api. this is a utility fn to convert the type from the toolcall to the final api request body.
    return {
      summary: event.summary,
      description: event.description,
      location: event.location,
      start: event.allDay
        ? { date: event.startDate, timeZone: event.startTimeZone }
        : { dateTime: event.startDateTime, timeZone: event.startTimeZone },
      end: event.allDay
        ? { date: event.endDate, timeZone: event.endTimeZone }
        : { dateTime: event.endDateTime, timeZone: event.endTimeZone },
      reminders: {
        useDefault: event.useDefaultReminders ?? true,
        overrides: event.customReminders,
      },
      recurrence: event.recurrenceRules,
      eventType: event.eventType ?? 'default',
      status: event.status ?? 'confirmed',
      visibility: event.visibility ?? 'default',
      colorId: event.colorId,
    };
  }

export const calendarSchema = z.object({
    summary: z.string().describe("Title of the event (required)"),
    
    // Start time - required
    startDateTime: z.string().optional().describe("Start date and time in RFC3339 format (e.g., '2024-01-15T10:00:00-08:00'). Use this for timed events."),
    startDate: z.string().optional().describe("Start date in YYYY-MM-DD format for all-day events"),
    startTimeZone: z.string().optional().describe("Time zone for start time (e.g., 'America/New_York')"),
    
    // End time - required  
    endDateTime: z.string().optional().describe("End date and time in RFC3339 format (e.g., '2024-01-15T11:00:00-08:00'). Use this for timed events."),
    endDate: z.string().optional().describe("End date in YYYY-MM-DD format for all-day events"),
    endTimeZone: z.string().optional().describe("Time zone for end time (e.g., 'America/New_York')"),
    
    // Optional common fields
    description: z.string().optional().describe("Description of the event. Can contain HTML."),
    location: z.string().optional().describe("Geographic location of the event as free-form text"),
    
    // Event settings
    allDay: z.boolean().optional().describe("Whether this is an all-day event (if true, use startDate/endDate instead of startDateTime/endDateTime)"),
    
    // Reminders
    useDefaultReminders: z.boolean().optional().describe("Whether to use calendar's default reminders (default: true)"),
    customReminders: z.array(z.object({
      method: z.enum(['email', 'popup']).describe("Reminder method"),
      minutes: z.number().min(0).max(40320).describe("Minutes before event to trigger reminder (0-40320)")
    })).optional().describe("Custom reminders if not using defaults"),
    
    // Recurrence
    recurrenceRules: z.array(z.string()).optional().describe("RRULE strings for recurring events (RFC5545 format)"),
    
    // Event type
    eventType: z.enum(['default', 'birthday', 'focusTime', 'outOfOffice', 'workingLocation']).optional().describe("Specific type of event (default: 'default')"),
    
    // Status and visibility
    status: z.enum(['confirmed', 'tentative', 'cancelled']).optional().describe("Event status (default: 'confirmed')"),
    visibility: z.enum(['default', 'public', 'private', 'confidential']).optional().describe("Event visibility (default: 'default')"),
    
    // Color
    colorId: z.string().optional().describe("Color ID for the event (1-11)")
})

export const insertIntoCalendar = async (
    {
        accessToken,
        event
    } : {
        accessToken: string;
        event: z.infer<typeof calendarSchema> 
    }
)=>{
    const oauth2Client = new google.auth.OAuth2(
        env.GOOGLE_CLIENT_ID,
        env.GOOGLE_CLIENT_SECRET
      );
    
      oauth2Client.setCredentials({ access_token: accessToken });
    
      const calendar = google.calendar({
        version: "v3",
        auth: oauth2Client,
      });
      try{
        const response = await calendar.events.insert(
            {
                calendarId:"primary",
                requestBody: toGoogleCalendarFormat(event)
            }
        )

        return response.data

      }catch(e){
        return e
      }

}

// const calendar = google.calendar({
//     version:"v3",
//     auth:oauth2Client
// })
