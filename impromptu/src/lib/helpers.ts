'use server'
import { headers } from "next/headers";
import { createCaller as ActualRootCreateCaller } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";
import { cache } from "react"; 

const createHelperContext = cache(async () => {
  const heads = new Headers(await headers());
  heads.set("x-trpc-source", "server-helper"); 
  return createTRPCContext({
    headers: heads,
  });
});

let helperApiInstance: ReturnType<typeof ActualRootCreateCaller> | null = null;

function getHelperApiSingleton(): ReturnType<typeof ActualRootCreateCaller> {
    helperApiInstance ??= ActualRootCreateCaller(createHelperContext);
    return helperApiInstance;
}

export async function calendarHelper(): Promise<string> {
    const currentHelperApi = getHelperApiSingleton();
    const accessToken = await currentHelperApi.accounts.getAccess();

    if (!accessToken) {
        console.error("[calendarHelper] Failed to retrieve a valid Google Calendar access token from accounts.getAccess. It returned null or undefined.");
        throw new Error("Google Calendar access token is missing, invalid, or could not be refreshed. Please ensure your Google account is connected and permissions are granted, or try re-authenticating.");
    }
    return accessToken;
}