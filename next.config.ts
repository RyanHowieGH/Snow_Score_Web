import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "pk_test_12345678901234567890",
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || "sk_test_dummy",
    CLERK_WEBHOOK_SIGNING_SECRET:
      process.env.CLERK_WEBHOOK_SIGNING_SECRET || "dummy_webhook_secret",
    POSTGRES_URL: process.env.POSTGRES_URL || "postgres://user:pass@localhost:5432/db",
    ARCHIVE_POSTGRES_URL:
      process.env.ARCHIVE_POSTGRES_URL || "postgres://user:pass@localhost:5432/db",
  },
  output: "standalone",
};

export default nextConfig;
