import type { NextConfig } from "next";

function sojApiProxyTarget() {
  const publicBaseUrl = process.env.NEXT_PUBLIC_SOJ_API_BASE_URL;
  if (publicBaseUrl && !publicBaseUrl.startsWith("/")) return publicBaseUrl;
  return process.env.SOJ_API_INTERNAL_BASE_URL ?? "http://localhost:8080";
}

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/soj-api/:path*",
        destination: `${sojApiProxyTarget()}/:path*`,
      },
    ];
  },
};

export default nextConfig;
