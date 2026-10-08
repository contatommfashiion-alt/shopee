import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";

/** Roboto é a fonte do site da Shopee. */
const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Laranjinha — Encontre. Compartilhe. Ganhe.",
  description:
    "Consulte ofertas da Shopee, monte a mensagem pronta e compartilhe no WhatsApp manualmente.",
};

export const viewport: Viewport = {
  themeColor: "#ee4d2d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${roboto.variable} font-sans text-slate-900 antialiased`}>{children}</body>
    </html>
  );
}
