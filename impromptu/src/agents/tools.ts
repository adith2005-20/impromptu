import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { insertIntoCalendar, calendarSchema } from '@/lib/calendar';
import { calendarHelper } from '@/lib/helpers';

// Define schemas for tools to enable type inference and ensure consistency
const askForDetailsSchema = z.object({
    question: z.string().nonempty().describe("The questions you want the user to answer IN TEXT.")
});

const askTimeAndTimeZoneSchema = z.object({});

// Type for the input of makeGCalendarEntry tool - now uses imported calendarSchema
type MakeGCalendarEntryInput = z.infer<typeof calendarSchema>;

const askForDetails = tool((input: z.infer<typeof askForDetailsSchema>) => {
    return input.question; // Utilize the input.question as per schema description
}, {
    name: 'askForDetails',
    description: 'Use to ask the user for required/important information they missed out on. Do not poke the user with unwanted requests.',
    schema: askForDetailsSchema
});

const askTimeAndTimeZone = tool((_input: z.infer<typeof askTimeAndTimeZoneSchema>) => { // Prefix unused 'input' with '_'
    const currTime = new Date();
    return `Current date: ${currTime.toISOString()} Time zone: IST(Kolkata)\n`; // Use toISOString() for Date in template literal
}, {
    name: 'askTimeAndTimeZone',
    description: 'Returns the current time/date from the server (need not be in the same time zone as user) along with time zone of the user',
    schema: askTimeAndTimeZoneSchema
});

const makeGCalendarEntry = tool(async (input: MakeGCalendarEntryInput) => {
    const accessToken = await calendarHelper();
    try {
        const calres = await insertIntoCalendar({
            accessToken: accessToken,
            event: input, // No longer need 'as any' because input type matches expected type
        });

        // Type guard to ensure calres is not an Error and is a valid event object
        if (calres && !(calres instanceof Error) && typeof calres === 'object' && calres !== null && 'id' in calres) {
            return `Successfully created event: '${input.summary}'. Event ID: ${String((calres as { id?: string | null }).id)}`;
        } else if (calres instanceof Error) {
            return `Failed to create event '${input.summary}'. Error: ${calres.message}`;
        } else if (calres) {
            console.warn("[makeGCalendarEntry] insertIntoCalendar returned a response, but it's not a standard event object or Error:", calres);
            return `Event creation attempted for '${input.summary}'. Response: ${JSON.stringify(calres)}`;
        } else {
            return `Event creation attempted for '${input.summary}', but received no definitive confirmation from the calendar API.`;
        }
    } catch (e: unknown) { // Use 'unknown' for catch variable type
        console.error("[makeGCalendarEntry] Error during calendar insertion:", e);
        let errorMessage = "An unknown error occurred while creating the calendar event.";
        
        if (e instanceof Error) {
            errorMessage = e.message;
        }

        // Safely access nested properties for Google Calendar API error details
        const gcalError = e as { response?: { data?: { error?: { message?: string; errors?: { reason?: string }[] } } } };
        const apiError = gcalError?.response?.data?.error;

        if (apiError?.message) {
            const reason = apiError.errors?.[0]?.reason;
            errorMessage = `Google Calendar API Error: ${apiError.message}${reason ? ` (${reason})` : ''}`;
        }
        return `Failed to create event '${input.summary}'. Error: ${errorMessage}`;
    }
}, {
    name: 'makeGCalendarEntry',
    description: 'Creates a new event in Google Calendar with the specified details in strict schema',
    schema: calendarSchema // Use imported calendarSchema directly
});

export const tools = [makeGCalendarEntry, askTimeAndTimeZone, askForDetails];