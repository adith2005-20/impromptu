import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { chatWithAgent } from "@/agents/testagent"; 
import { TRPCError } from "@trpc/server";

// Define individual event types that the agent can produce
const aiMessageEventSchema = z.object({
  type: z.literal("ai_message"),
  content: z.string(),
  timestamp: z.number(),
});

const aiToolCallEventSchema = z.object({
  type: z.literal("ai_tool_call"),
  toolCalls: z.array(
    z.object({
      name: z.string(),
      args: z.record(z.unknown()), 
      id: z.string(), 
    })
  ),
  timestamp: z.number(),
});

const toolResultEventSchema = z.object({
  type: z.literal("tool_result"),
  toolName: z.string(),
  toolCallId: z.string(), 
  content: z.string(), 
  timestamp: z.number(),
});

const agentEndEventSchema = z.object({
  type: z.literal("agent_end"),
  finalMessage: z.string().optional(), 
  timestamp: z.number(),
});

const agentErrorEventSchema = z.object({
  type: z.literal("agent_error"),
  message: z.string(),
  timestamp: z.number(),
});

// Create a discriminated union for all possible agent events
export const agentEventSchema = z.discriminatedUnion("type", [
  aiMessageEventSchema,
  aiToolCallEventSchema,
  toolResultEventSchema,
  agentEndEventSchema,
  agentErrorEventSchema,
]);

export type AgentEvent = z.infer<typeof agentEventSchema>;

// The output of the chatInterface mutation will be an array of AgentEvent objects
const chatOutputSchema = z.array(agentEventSchema);

export const chatRouter = createTRPCRouter({
  chatInterface: publicProcedure
    .input(
      z.object({
        inputmessage: z.string(),
        timezone: z.string().optional(), 
      })
    )
    .output(chatOutputSchema) 
    .mutation(async ({ input }) => {
      try {
        console.log("Received message for agent:", input.inputmessage);
        const events = await chatWithAgent(input.inputmessage, input.timezone);
        return events;
      } catch (error) {
        console.error("Error in chatInterface mutation:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred while processing your request.",
          cause: error,
        });
      }
    }),
});