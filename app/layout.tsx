// app/layout.tsx
import type { Metadata } from "next";
import { StytchProvider } from "@stytch/nextjs";
import { createStytchUIClient } from "@stytch/nextjs/ui";
// --- Assuming these are from next/font/google or similar ---
import { Geist } from "next/font/google"; // Adjust import if needed
import { Geist_Mono } from "next/font/google"; // Adjust import if needed
// --- End Font Imports ---
import "./globals.css";

// Initialize Stytch client
const stytchPublicKey = process.env.NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN;
if (!stytchPublicKey) {
    console.error("Missing NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN environment variable.");
    // Handle the error appropriately - maybe throw or provide a fallback?
    // For now, we'll let createStytchUIClient potentially handle it, but logging is good.
}
const stytch = createStytchUIClient(stytchPublicKey!);


// Initialize Fonts
const geistSans = Geist({
  // variable: "--font-geist-sans", // This property might not exist directly
  subsets: ["latin"],
  display: 'swap', // Good practice for font loading
  // Ensure you're only providing valid options for the specific font function
});

const geistMono = Geist_Mono({
  // variable: "--font-geist-mono", // This property might not exist directly
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
    title: "SnowScore", // Update title
    description: "Ski and Snowboard Competition Management", // Update description
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <StytchProvider stytch={stytch}>
      <html lang="en">
        {/* --- APPLY FONT CLASSES DIRECTLY --- */}
        <body className={`${geistSans.className} ${geistMono.className} antialiased`}>
        {/*
          If you NEEDED the CSS variable names for use elsewhere (e.g., in tailwind.config.js),
          you might define them manually or access them differently if the font loader provides them.
          Example (check next/font docs for exact property if available):
          <body style={{
              '--font-geist-sans': geistSans.style.fontFamily, // Or appropriate property
              '--font-geist-mono': geistMono.style.fontFamily, // Or appropriate property
          }}
          className={`antialiased`} // Apply other classes needed
          >
        */}
          {children}
        </body>
      </html>
    </StytchProvider>
  );
}