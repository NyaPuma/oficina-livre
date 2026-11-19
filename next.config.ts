import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Necessário para os testes E2E servidos em 127.0.0.1 (Next 16 bloqueia HMR cross-origin).
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  // O pdfkit lê ficheiros de fontes a partir do seu próprio diretório.
  serverExternalPackages: ["pdfkit"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
