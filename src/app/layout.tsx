import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { getCompanySettings } from "@/lib/branding";
import ThemeRegistry from "@/theme/ThemeRegistry";
import {
  GoogleTagManagerScript,
  GoogleTagManagerNoScript,
} from "@/components/analytics/GoogleTagManager";
import WhatsAppTracker from "@/components/analytics/WhatsAppTracker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getCompanySettings();
  return {
    title: {
      default: settings.companyName,
      template: `%s | ${settings.companyName}`,
    },
    description: `Renta el vehículo perfecto con ${settings.companyName}.`,
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <GoogleTagManagerNoScript />
        <AppRouterCacheProvider options={{ key: "mui" }}>
          <ThemeRegistry>{children}</ThemeRegistry>
        </AppRouterCacheProvider>
        <WhatsAppTracker />
        <GoogleTagManagerScript />
      </body>
    </html>
  );
}
