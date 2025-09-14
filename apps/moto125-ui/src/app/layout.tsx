import type { ReactNode } from "react";

/**
 * Root layout of the app.
 * Wraps all routes with common HTML, <head> metadata and shared UI.
 */
export const metadata = {
  title: "moto125-ui",
  description: "Next.js app consuming DataMirror cache"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        {/* You can add favicons, fonts, analytics scripts here */}
      </head>
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          background: "#fafafa",
          color: "#111"
        }}
      >
        <header
          style={{
            padding: "1rem 2rem",
            borderBottom: "1px solid #ddd",
            background: "white",
            position: "sticky",
            top: 0,
            zIndex: 100
          }}
        >
          <h1 style={{ margin: 0, fontSize: "1.5rem" }}>moto125-ui</h1>
        </header>

        <main style={{ minHeight: "80vh" }}>{children}</main>

        <footer
          style={{
            padding: "1rem 2rem",
            borderTop: "1px solid #ddd",
            background: "white",
            textAlign: "center"
          }}
        >
          <small>© {new Date().getFullYear()} moto125</small>
        </footer>
      </body>
    </html>
  );
}
