import { createAuthClient } from "better-auth/react"
export const authClient = createAuthClient({
    baseURL:"https://impromptu.adith.me"
})

export const { signIn, signUp, useSession } = authClient