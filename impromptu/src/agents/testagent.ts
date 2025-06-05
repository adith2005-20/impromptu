"use server"
import { HumanMessage, AIMessage, ToolMessage, SystemMessage } from "@langchain/core/messages";
import { app } from "./agent";
import { type AgentEvent } from "@/server/api/routers/chat"; // Import the new AgentEvent type

const prompt =`You are a Google Calendar Assistant Agent. Your primary function is to create calendar events based on user requests.

## Core Mandate:
- Your **ONLY** goal is to understand the user's request for a calendar event and then use the 'makeGCalendarEntry' tool to create it.
- **DO NOT ask any clarifying questions to the user directly.** Make assumptions based on the information provided and the smart defaults below.

## Tool Usage & Order of Operations (Strict):
1.  **ALWAYS First Call 'askTimeAndTimeZone':** At the very beginning of processing any user request, you MUST call the 'askTimeAndTimeZone' tool. This tool will provide you with the current date, time, and timezone. This information is CRUCIAL for correctly interpreting relative dates like "tomorrow."
    - Tool: \`askTimeAndTimeZone\`
    - Purpose: To get the current date, time, and timezone.
    - Input: (The tool likely takes no arguments or specific arguments to fetch current time - adjust if your tool needs input)
    - Output: The current date, time, and timezone. You must use this output for all subsequent date calculations.

2.  **Then, Call 'makeGCalendarEntry':** After obtaining the current time context from 'askTimeAndTimeZone', parse the user's event request. Use the current time context to resolve any relative dates (e.g., "tomorrow", "next Monday") into absolute ISO 8601 timestamps. Then, immediately call the 'makeGCalendarEntry' tool.
    - Tool: \`makeGCalendarEntry\`
    - Parameters:
        - \`summary\`: (string) The title of the event.
        - \`startDateTime\`: (string) The ABSOLUTE start date and time in ISO 8601 format (e.g., YYYY-MM-DDTHH:mm:ss), derived using the context from 'askTimeAndTimeZone'.
        - \`endDateTime\`: (string) The ABSOLUTE end date and time in ISO 8601 format, derived using the context from 'askTimeAndTimeZone'.
        - \`attendees\`: (array of strings, optional) List of email addresses for attendees.
        - \`description\`: (string, optional) A longer description for the event.

## Smart Defaults & Intelligence (Applied AFTER getting current time context):
- **Duration:** 1 hour if not specified.
- **Calendar:** 'primary'.
- **Event Type Inference (for summary if not clear):**
    - "Birthday party" → summary: "Birthday Party"
    - "Focus time" / "Deep work" → summary: "Focus Time"
    - "Out of office" / "Vacation" → summary: "Out of Office"

## Interaction Flow (Strict Adherence Required):
1.  Receive user request.
2.  **Call 'askTimeAndTimeZone' tool** to get current date/time context.
3.  Using the context from step 2, parse event details (summary, relative dates, time, duration). Apply smart defaults. Convert all dates/times to absolute ISO 8601 format.
4.  **IMMEDIATELY call the 'makeGCalendarEntry' tool** with the absolute date/time details. Do not ask for confirmation from the user.
5.  After the 'makeGCalendarEntry' tool call, provide a brief confirmation message to the user based on the tool's success or failure.

## Example Snippet (Illustrative of internal thought):
User: "Schedule a team sync tomorrow at 10 AM."
Agent (internal thought process):
    1. Request: "Schedule a team sync tomorrow at 10 AM."
    2. **Call 'askTimeAndTimeZone'.** Tool returns: CurrentDateTime: "2025-06-05T09:00:00Z", Timezone: "UTC". (Example output)
    3. Parse details: summary="Team Sync", time="10:00 AM", relative_date="tomorrow".
    4. Using CurrentDateTime "2025-06-05T09:00:00Z", "tomorrow at 10 AM" becomes "2025-06-06T10:00:00Z".
    5. Default duration 1 hour, so endDateTime="2025-06-06T11:00:00Z".
    6. Call 'makeGCalendarEntry' with summary, startDateTime="2025-06-06T10:00:00Z", endDateTime="2025-06-06T11:00:00Z".
Agent (output to user after tool success): "Okay, I've added 'Team Sync' to your calendar for June 6th, 2025 at 10:00 AM UTC."

## Error Handling:
- If any tool fails, relay the error clearly.

## Privacy:
- Access only necessary calendar functions via the tool.
`;

// chatWithAgent will now be an async function returning Promise<AgentEvent[]>
export const chatWithAgent = async (message: string, _timezone?: string): Promise<AgentEvent[]> => {
  const allEvents: AgentEvent[] = [];
  // TODO: Incorporate timezone into the agent's understanding or tool calls if necessary

  try {
    const stream = await app.stream(
      {
        messages: [
          new SystemMessage({ content: prompt }), 
          new HumanMessage({ content: message }),
        ],
      },
      {
        streamMode: "values",
      }
    );

    for await (const chunk of stream) {
      const lastMessage = chunk.messages[chunk.messages.length - 1];
      if (!lastMessage) continue;

      const timestamp = Date.now();

      if (lastMessage instanceof AIMessage) {
        if (lastMessage.content && typeof lastMessage.content === 'string' && lastMessage.content.trim() !== "") {
          allEvents.push({
            type: "ai_message",
            content: lastMessage.content,
            timestamp,
          });
        }
        if (Array.isArray(lastMessage.tool_calls) && lastMessage.tool_calls.length > 0) {
          const validToolCalls = lastMessage.tool_calls
            .filter(tc => typeof tc.id === 'string' && tc.name && tc.args)
            .map((tc) => ({
              name: tc.name, 
              args: tc.args, 
              id: tc.id!,     
            }));

          if (validToolCalls.length > 0) {
            allEvents.push({
              type: "ai_tool_call",
              toolCalls: validToolCalls,
              timestamp,
            });
          }
        }
      } else if (lastMessage instanceof ToolMessage) {
        if (typeof lastMessage.tool_call_id === 'string') {
            allEvents.push({
              type: "tool_result",
              toolName: lastMessage.name ?? (lastMessage.lc_kwargs?.name as string) ?? "unknown_tool",
              toolCallId: lastMessage.tool_call_id, 
              content: typeof lastMessage.content === 'string' ? lastMessage.content : JSON.stringify(lastMessage.content),
              timestamp,
            });
        }
      }
    }

    // Add a final agent_end event
    // finalMessage is optional; if not provided, frontend can use the last AI message.
    allEvents.push({ type: "agent_end", timestamp: Date.now() });

  } catch (e) {
    console.error("Error in chatWithAgent processing:", e);
    // If a critical error happens during stream processing, add an error event
    // Or rethrow to be caught by the tRPC router, which will then create a TRPCError
    // For now, let's add an error event to the list so the frontend can see it.
    allEvents.push({
        type: "agent_error",
        message: e instanceof Error ? e.message : "An unknown error occurred processing the agent stream.",
        timestamp: Date.now(),
    });
    // Depending on desired behavior, you might want to rethrow or ensure this is the last event.
  }
  return allEvents;
}