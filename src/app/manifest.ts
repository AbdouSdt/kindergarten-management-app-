import type { MetadataRoute } from "next";

// PWA web app manifest, served by Next.js at /manifest.webmanifest.
// Colours mirror the CSS variables in src/app/globals.css:
//   --background: 0 0% 100%   -> #ffffff
//   --primary:    221 83% 53% -> #2563eb
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "منصة تسيير روضة الأطفال",
    short_name: "الروضة",
    description: "منصة لتسيير روضة الأطفال: الحضور، الجداول، الاشتراكات والإعلانات.",
    lang: "ar",
    dir: "rtl",
    display: "standalone",
    start_url: "/",
    scope: "/",
    theme_color: "#2563eb",
    background_color: "#ffffff",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
