import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OfertaZap — Encontre. Compartilhe. Ganhe.",
  description:
    "Consulte ofertas da Shopee, monte a mensagem pronta e compartilhe no WhatsApp manualmente.",
};

export const viewport: Viewport = {
  themeColor: "#047857",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${geist.variable} font-sans text-slate-900 antialiased`}>{children}</body>
    </html>
  );
}
