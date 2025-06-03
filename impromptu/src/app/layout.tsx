import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { Providers } from "./providers";
import Header from "@/components/ui/Header";

export const metadata: Metadata = {
  title: "Impromptu AI",
  description: "Prompt to calendar of your choice",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body className="">
        <TRPCReactProvider><Providers><Header/>{children}</Providers></TRPCReactProvider>
      </body>
    </html>
  );
}
