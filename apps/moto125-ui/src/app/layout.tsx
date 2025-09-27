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
import GATag from "@/components/googleAnalytics/GATag";
import GAListener from "@/components/googleAnalytics/GAListener";
import ConsentDialog from "@/components/googleAnalytics/ConsentDialog";
import ConsentBootstrap from "@/components/googleAnalytics/ConsentBootstrap";
import {
  COOKIES_CONSENT_DENY_TTL_HOURS,
  COOKIES_CONSENT_GRANT_TTL_DAYS,
} from "@/constants";

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

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const state = await getMirrorState();
  const cfg = state?.data?.config ?? null;
  return buildSiteMetadataFromConfig(cfg);
}

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const state = await getMirrorState();
  const cfg = state?.data?.config ?? null;
  const gaId = cfg?.googleAnalyticsId;
  const logoSrc = cfg?.logo?.url;

  return (
    <html lang="es" className={`${heading.variable} ${body.variable}`}>
      <body className="bg-[#fafafa] text-[#111] font-body antialiased">
        <ConsentBootstrap />

        <Header />

        <CompactHeader />

        <HeaderWatcher />

        <main>{children}</main>

        <Footer />
        {gaId ? (
          <>
            <GATag gaId={gaId} />
            <GAListener gaId={gaId} />
            <ConsentDialog
              gaId={gaId}
              logoSrc={logoSrc}
              denyTtlHours={COOKIES_CONSENT_DENY_TTL_HOURS}
              grantTtlDays={COOKIES_CONSENT_GRANT_TTL_DAYS}
              privacyHref="/politica-de-privacidad"
            />
          </>
        ) : null}
      </body>
    </html>
  );
}
