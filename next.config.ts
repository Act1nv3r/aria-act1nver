import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  // jspdf depends on fflate which uses Node.js Worker threads — exclude from SSR bundle
  serverExternalPackages: ["jspdf", "html2canvas", "fflate"],
};

export default nextConfig;
