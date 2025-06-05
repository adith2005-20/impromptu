import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/server/db"; // your drizzle instance
import { env } from "@/env";
import {cache} from "react"
import {headers} from "next/headers"
 
export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg", // or "mysql", "sqlite"
    }),
    emailAndPassword: {
        enabled: true
    },
    updateAccountOnSignIn: {
        enabled: true
    },
    socialProviders: {
        google : {
            enabled: true,
            scope:["https://www.googleapis.com/auth/calendar.events"],
            clientId:env.GOOGLE_CLIENT_ID,
            clientSecret:env.GOOGLE_CLIENT_SECRET,
            accessType:"offline",
        }
    },
    session: {
        cookieCache: {
          enabled: true,
          maxAge: 5 * 60, // Cache duration in seconds
        },
    },
    
});

export const getSession = cache(async () => {
    return await auth.api.getSession({
        headers: await headers(),
    });
});