// app/layout.tsx
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { ClerkProvider } from '@clerk/nextjs';

const placeholderKey = 'pk_test_12345678901234567890';
const envKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const publishableKey = envKey && envKey !== placeholderKey ? envKey : undefined;
import "./globals.css";
import type { Metadata } from "next";



export const metadata: Metadata = {
    title: "SnowScore",
    description: "Ski and Snowboard Competition Management",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const content = (
    <html lang="en">
      {/* --- Use the imported font objects directly --- */}
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        {children}
      </body>
      {/* --- End Usage --- */}
    </html>
  );

  return publishableKey ? (
    <ClerkProvider publishableKey={publishableKey}>{content}</ClerkProvider>
  ) : (
    content
  );
}

