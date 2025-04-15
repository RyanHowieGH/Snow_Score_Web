// app/layout.tsx
import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs'; // Import Clerk provider
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Initialize Fonts
const geistSans = Geist({ subsets: ["latin"], display: 'swap' });
const geistMono = Geist_Mono({ subsets: ["latin"], display: 'swap' });

export const metadata: Metadata = {
    title: "SnowScore",
    description: "Ski and Snowboard Competition Management",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // Wrap with ClerkProvider - keys are read automatically from env vars
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.className} ${geistMono.className} antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}