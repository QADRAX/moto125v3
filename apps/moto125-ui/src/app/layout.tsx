import type { ReactNode } from "react";
import "./globals.css";

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
    <html lang="es">
      <body className="bg-[#fafafa] text-[#111] font-body antialiased">
        <header className="sticky top-0 z-50 bg-white border-b border-[#ddd]">
          <div className="mx-auto max-w-page px-4 sm:px-6 h-14 flex items-center">
            <h1 className="m-0 text-xl font-heading tracking-wide">moto125-ui</h1>
          </div>
        </header>

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
