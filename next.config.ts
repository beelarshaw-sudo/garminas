import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Do NOT use output: "standalone" — it breaks Vercel deployment.
  // Vercel expects standard Next.js build output.
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Allow Prisma to work in serverless environment
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs", "@neondatabase/serverless", "@prisma/adapter-neon"],
  },
};

export default nextConfig;
