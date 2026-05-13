import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://b4gestao.com.br";
  const now = new Date();

  return [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/#quem-somos`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/#servicos`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/#nr01`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/#avaliacao`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
  ];
}
