"use client";
import React, { useState } from "react";
import { Textarea } from "./textarea";
import { Button } from "./button";
import { SendIcon, ChevronDown, ChevronUp, Loader2Icon, CheckIcon } from "lucide-react"; 
import { api } from "@/trpc/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";
import { type AgentEvent } from "@/server/api/routers/chat"; 

const HomeComponent = () => {
  const [messageVal, setMessageVal] = useState("");
  const [agentEvents, setAgentEvents] = useState<AgentEvent[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  const mutation = api.chat.chatInterface.useMutation({
    onSuccess: (data) => {
      setAgentEvents(data);
      // Optionally, find the last user-facing message to display prominently
      // For now, we'll just make all events available under "details"
    },
    onError: (error) => {
      // Error is already handled by mutation.error, but you can add custom logic here
      console.error("Mutation error:", error);
      setAgentEvents([]); // Clear previous events on new error
    },
    onSettled: () => {
      // Optionally clear input or do other cleanup
      // setMessageVal("");
    }
  });

  const handleSend = () => {
    if (!messageVal.trim() || mutation.isPending) return;
    setAgentEvents([]); // Clear previous events before new request
    setShowDetails(false); // Collapse details on new request
    mutation.mutate({ inputmessage: messageVal });
  };

  const renderEventDetail = (event: AgentEvent, index: number) => {
    const cardKey = `event-${index}-${event.timestamp}`;
    switch (event.type) {
      case "ai_message":
        return <CardDescription key={cardKey}><strong>AI:</strong> {event.content}</CardDescription>;
      case "ai_tool_call":
        return (
          <div key={cardKey} className="p-2 my-1 rounded bg-muted/50">
            <CardDescription className="font-semibold">AI is considering tools:</CardDescription>
            <ul className="pl-4 text-sm list-disc">
              {event.toolCalls.map(tc => (
                <li key={tc.id}><CardDescription>Tool: {tc.name}, Args: {JSON.stringify(tc.args)} (ID: {tc.id})</CardDescription></li>
              ))}
            </ul>
          </div>
        );
      case "tool_result":
        return (
          <CardDescription key={cardKey} className="p-2 my-1 rounded bg-muted/50">
            <strong>Tool Result ({event.toolName} - ID: {event.toolCallId}):</strong> {event.content}
          </CardDescription>
        );
      case "agent_end":
        return <CardDescription key={cardKey} className="italic">{event.finalMessage ?? "Agent finished processing."}</CardDescription>;
      case "agent_error":
        return <CardDescription key={cardKey} className="italic text-destructive">Agent Error: {event.message}</CardDescription>;
      default:
        return <CardDescription key={cardKey} className="italic">Unknown event type.</CardDescription>;
    }
  };

  const getFinalMessage = () => {
    if (mutation.error) return "An error occurred.";
    if (agentEvents.length === 0 && !mutation.isPending) return "Send a message to start.";
    if (agentEvents.length === 0 && mutation.isPending) return "Agent is thinking...";

    const lastAiMessage = [...agentEvents].reverse().find(e => e.type === 'ai_message');
    const agentEndMessage = agentEvents.find(e => e.type === 'agent_end');
    const agentErrorMessage = agentEvents.find(e => e.type === 'agent_error');

    if (agentErrorMessage) return `Error: ${agentErrorMessage.message}`;
    if (agentEndMessage?.finalMessage) return agentEndMessage.finalMessage;
    if (lastAiMessage?.type === 'ai_message' && lastAiMessage.content) return lastAiMessage.content;
    if (agentEndMessage) return "Agent processing complete.";
    return "Agent is working..."; 
  };

  return (
    <div className="text-foreground w-full min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="relative w-full max-w-2xl mb-8">
        <Textarea
          className="w-full pr-16 resize-none h-36"
          placeholder="Generate a schedule... e.g., 'Schedule a team meeting tomorrow at 10am for 1 hour'"
          value={messageVal}
          onChange={(e) => setMessageVal(e.target.value)}
          disabled={mutation.isPending}
        />
        <Button
          size="icon"
          className="absolute right-3 top-3 bg-primary text-white p-2 rounded-full hover:bg-primary/90 transition-colors"
          onClick={handleSend}
          disabled={mutation.isPending || !messageVal.trim()}
          title="Send message"
        >
          <SendIcon className="w-4 h-4" />
        </Button>
      </div>

      {/* Main Response Card */} 
      {(mutation.isPending || agentEvents.length > 0 || mutation.error) && (
        <Card className={`w-full max-w-2xl ${mutation.error ? 'border-destructive' : ''}`}>
          <CardHeader>
            <CardTitle className="flex justify-between">
              {mutation.isPending ? "Agent is thinking..." : mutation.error ? "Error" : "Agent Response"}
              {mutation.isPending && <Loader2Icon className="animate-spin"/>}
              {mutation.isSuccess && <CheckIcon className="animate-out"/>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className={mutation.error ? 'text-destructive' : ''}>
              {mutation.isPending ? "Please wait..." : getFinalMessage()}
            </CardDescription>
          </CardContent>
          {agentEvents.length > 0 && !mutation.isPending && (
            <CardFooter className="flex-col items-start">
              <Button variant="link" onClick={() => setShowDetails(!showDetails)} className="px-0 py-1 text-sm">
                {showDetails ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                {showDetails ? "Hide Details" : "Show Details"}
              </Button>
              {showDetails && (
                <div className="mt-2 w-full p-2 border rounded-md bg-background max-h-[300px] overflow-y-auto space-y-2">
                  {agentEvents.map(renderEventDetail)}
                </div>
              )}
            </CardFooter>
          )}
        </Card>
      )}
    </div>
  );
};

export default HomeComponent;
