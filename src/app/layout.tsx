import type { Metadata, Viewport } from "next";
import "./globals.css";
import MobileShell from "@/components/layout/MobileShell";

export const metadata: Metadata = {
  title: "GymFlow — Nutrição Esportiva & Gastronomia Fit",
  description: "Refeições personalizadas para atletas, contagem de macros em tempo real e entrega ultra-rápida.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GymFlow",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#030304",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="antialiased bg-[#030304] text-zinc-100 selection:bg-emerald-500/20 selection:text-emerald-400">
        <MobileShell>{children}</MobileShell>
      </body>
    </html>
  );
}
