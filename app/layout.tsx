// app/layout.tsx
import { GeistSans } from 'geist/font/sans'; // Use this import for the sans-serif font object
import { GeistMono } from 'geist/font/mono';   // Use this import for the mono font object
import { ClerkProvider } from '@clerk/nextjs';
import "./globals.css";
import type { Metadata } from "next";



export const metadata: Metadata = {
    title: "SnowScore",
    description: "Ski and Snowboard Competition Management",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en">
        {/* --- Use the imported font objects directly --- */}
        <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
          {children}
        </body>
        {/* --- End Usage --- */}
      </html>
    </ClerkProvider>
  );
}