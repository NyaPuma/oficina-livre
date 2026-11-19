import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Oficina Livre — Modo mecânico",
    short_name: "Oficina Livre",
    description: "Gestão de oficina automóvel, livre e open-source",
    start_url: "/movel",
    scope: "/",
    display: "standalone",
    background_color: "#f6f7f9",
    theme_color: "#0f172a",
    lang: "pt-PT",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
