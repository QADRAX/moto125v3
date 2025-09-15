import type { ReactNode } from "react";
import "./globals.css";
import { Barlow_Condensed, Manrope } from "next/font/google";
import CompactHeader from "@/components/header/CompactHeader";
import HeaderWatcher from "@/components/header/HeaderWatcher";
import Header from "@/components/header/Header";

const heading = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

const body = Manrope({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-body",
  display: "swap",
});

/**
 * Root layout of the app.
 * Wraps all routes with common HTML, <head> metadata and shared UI.
 */
export const metadata = {
  title: "moto125-ui",
  description: "Next.js app consuming DataMirror cache",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${heading.variable} ${body.variable}`}>
      <body className="bg-[#fafafa] text-[#111] font-body antialiased">
        <Header />

        <CompactHeader />

        <HeaderWatcher />

        <main className="min-h-[80vh]">
          {children}
        </main>

        <footer className="bg-white border-t border-[#ddd]">
          <div className="mx-auto max-w-page px-4 sm:px-6 py-4 text-center text-sm">
            © {new Date().getFullYear()} moto125.cc
          </div>
        </footer>
      </body>
    </html>
  );
}
