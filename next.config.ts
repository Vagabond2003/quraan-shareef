import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  /* config options here */
  // Static export for GitHub Pages.
  output: "export",
  trailingSlash: true,
  basePath,
};

export default nextConfig;
