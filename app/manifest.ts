import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "B4 Gestão Ocupacional",
    short_name: "B4 Gestão",
    description:
      "Consultoria especializada em Saúde e Segurança do Trabalho com inteligência estratégica.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0097A7",
    icons: [
      {
        src: "/images/logo-icon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/images/logo-icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
