import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ToolNode } from '@langchain/langgraph/prebuilt';
import {
    StateGraph,
    MessagesAnnotation,
    END,
    START
  } from "@langchain/langgraph";
import { tools } from "./tools";
import { env } from "@/env";

const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash",
    apiKey: env.GEMINI_API_KEY
}).bindTools(tools)

const toolNode = new ToolNode(tools)

// const something = await toolNode.invoke({ messages: [await model.invoke("ask the user something.")] })

// console.dir(something)

const shouldContinue = (state: typeof MessagesAnnotation.State) => {
    const { messages } = state;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && "tool_calls" in lastMessage && Array.isArray(lastMessage.tool_calls) && lastMessage.tool_calls?.length) {
        return "tools";
    }
    return END;
  }

const callModel = async (state: typeof MessagesAnnotation.State) => {
    const { messages } = state;
    const response = await model.invoke(messages);
    return { messages: response };
}

const workflow = new StateGraph(MessagesAnnotation)
.addNode("agent",callModel)
.addNode("tools",toolNode)
.addEdge(START, "agent")
.addConditionalEdges("agent",shouldContinue,["tools",END])
.addEdge("tools","agent")

export const app = workflow.compile()