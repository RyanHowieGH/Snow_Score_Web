// app/layout.tsx
import type { Metadata } from "next";
import { StytchProvider } from "@stytch/nextjs";
import { createStytchUIClient } from "@stytch/nextjs/ui";
import { Geist, Geist_Mono } from "next/font/google"; // Assuming using next/font
import "./globals.css";

// Initialize Stytch client for the browser
const stytchPublicKey = process.env.NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN;
if (!stytchPublicKey) {
  throw new Error("Missing NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN env var!");
}
const stytch = createStytchUIClient(stytchPublicKey);

// Initialize Fonts
const geistSans = Geist({ subsets: ["latin"], display: 'swap' });
const geistMono = Geist_Mono({ subsets: ["latin"], display: 'swap' });

export const metadata: Metadata = {
    title: "SnowScore",
    description: "Ski and Snowboard Competition Management",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // Wrap the entire app with the StytchProvider
    <StytchProvider stytch={stytch}>
      <html lang="en">
        <body className={`${geistSans.className} ${geistMono.className} antialiased`}>
          {children}
        </body>
      </html>
    </StytchProvider>
  );
}