import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";


export const accountsRouter = createTRPCRouter({
  getAccess: protectedProcedure
  .query(async ({ ctx }) => {
    const userIdFromCtx = ctx?.userId;

    if (!userIdFromCtx) {
        console.error("[accounts.getAccess] Critical: UserID not found in Better Auth protected procedure context.");
        throw new Error("User not authenticated - UserID missing from context.");
    }

    try {
        
        //assuming accesstoken is valid

        const refreshTokenResponse = await auth.api.refreshToken({
            body:{
                providerId:"google",
                userId: userIdFromCtx
            },
            headers: await headers()
        })
        
        

        return refreshTokenResponse.accessToken

    } catch (error: unknown) {
        let message = 'Unknown error during auth.api call';
        if (error instanceof Error) {
            message = error.message;
        }
        throw new Error(`Failed to get access token from Better Auth: ${message}`);
    }
  })
});