import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://shriramsolar.in";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/api/admin/",
      ],
    },

    sitemap: `${baseUrl}/sitemap.xml`,
  };
}