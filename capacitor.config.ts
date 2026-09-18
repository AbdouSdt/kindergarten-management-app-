import type { CapacitorConfig } from "@capacitor/cli";

// The shell is a thin WebView around the deployed Next.js app (Server Actions
// and cookie auth rule out a static export), so `webDir` is only a placeholder.
//
// Deployed URL: set CAPACITOR_SERVER_URL when running `npx cap sync`, e.g.
//   CAPACITOR_SERVER_URL=https://my-app.vercel.app npx cap sync android
// A dedicated variable is used on purpose: NEXT_PUBLIC_SITE_URL is
// http://localhost:3000 in local dev and must never leak into the APK.
const DEFAULT_SERVER_URL = "https://kindergarten-management-app.vercel.app/";

const serverUrl = process.env.CAPACITOR_SERVER_URL?.trim() || DEFAULT_SERVER_URL;

if (!serverUrl.startsWith("https://")) {
  throw new Error(
    `CAPACITOR_SERVER_URL must be an https:// URL (got "${serverUrl}"). Cleartext HTTP is disabled in the Android shell.`,
  );
}

const config: CapacitorConfig = {
  appId: "dz.creche.app",
  appName: "منصة الروضة",
  webDir: "capacitor-www",
  server: {
    url: serverUrl,
    androidScheme: "https",
    cleartext: false,
  },
};

export default config;
