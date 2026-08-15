import type { NextConfig } from "next";

function sojApiProxyTarget() {
  const publicBaseUrl = process.env.NEXT_PUBLIC_SOJ_API_BASE_URL;
  const target = publicBaseUrl && !publicBaseUrl.startsWith("/") ? publicBaseUrl : process.env.SOJ_API_INTERNAL_BASE_URL ?? "http://localhost:8080";
  return target.replace(/\/+$/, "");
}

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  output: "standalone",
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
