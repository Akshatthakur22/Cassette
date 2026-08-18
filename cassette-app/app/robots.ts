import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const domain = process.env.NEXT_PUBLIC_DOMAIN || "https://cassette-share.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/shelf", "/create", "/t/", "/privacy", "/terms", "/developer", "/llms.txt"],
        disallow: ["/manage/", "/api/", "/admin/"],
      },
    ],
    sitemap: `${domain}/sitemap.xml`,
  };
}
