import "server-only";
import Script from "next/script";

/**
 * Injects Consent Mode v2 defaults (deny until user acts).
 * Keep this as a Server Component so it renders as early as possible.
 */
export default function ConsentDefaults() {
  return (
    <Script id="consent-default" strategy="beforeInteractive">
      {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('consent', 'default', {
          'ad_storage': 'denied',
          'analytics_storage': 'denied',
          'ad_user_data': 'denied',
          'ad_personalization': 'denied',
          'wait_for_update': 500
        });
      `}
    </Script>
  );
}
