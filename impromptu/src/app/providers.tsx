"use client"
 
import { AuthUIProvider } from "@daveyplate/better-auth-ui"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { ReactNode } from "react"
import { Toaster } from "@/components/ui/sonner"
 
import { authClient } from "@/lib/auth-client"
 
export function Providers({ children }: { children: ReactNode }) {
    const router = useRouter()
 
    return (
        <AuthUIProvider
        authClient={authClient}
        navigate={(...args) => router.push(...args)}
        replace={(...args) => router.replace(...args)}
            onSessionChange={() => {
                router.refresh()
            }}
            Link={Link}
            providers={["google"]}
        >
            {children}
            <Toaster position="top-left"/>
        </AuthUIProvider>
    )
}