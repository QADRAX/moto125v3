import type { ReactNode } from "react";
import "./globals.css";
import { Roboto_Condensed, Lato } from "next/font/google";
import CompactHeader from "@/components/header/CompactHeader";
import HeaderWatcher from "@/components/header/HeaderWatcher";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import type { Metadata } from "next";
import { getMirrorState } from "@/server/dataMirror";
import { buildSiteMetadataFromConfig } from "@/server/seo";

const heading = Roboto_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

const body = Lato({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-body",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const state = await getMirrorState();
  const cfg = state?.data?.config ?? null;
  return buildSiteMetadataFromConfig(cfg);
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${heading.variable} ${body.variable}`}>
      <body className="bg-[#fafafa] text-[#111] font-body antialiased">
        <Header />

        <CompactHeader />

        <HeaderWatcher />

        <main>
          {children}
        </main>

        <Footer />
      </body>
    </html>
  );
}
