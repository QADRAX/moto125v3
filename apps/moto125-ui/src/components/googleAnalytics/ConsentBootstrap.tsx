import "server-only";
import Script from "next/script";
import { cookies } from "next/headers";

/**
 * Bootstrap Consent Mode v2:
 * - Default denied (GDPR-friendly).
 * - Apply saved choice from cookie BEFORE GA loads.
 */
export default function ConsentBootstrap({
  cookieName = "m125-consent",
}: { cookieName?: string }) {
  const choice = cookies().get(cookieName)?.value ?? "";

  const choiceJs = JSON.stringify(choice);

  return (
    <Script id="consent-bootstrap" strategy="beforeInteractive">
      {`
        // Ensure dataLayer/gtag stubs exist ASAP
        window.dataLayer = window.dataLayer || [];
        function gtag(){ dataLayer.push(arguments); }
        window.gtag = window.gtag || gtag;

        // 1) Default: deny everything
        gtag('consent', 'default', {
          ad_storage: 'denied',
          analytics_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
          wait_for_update: 500
        });

        // 2) Apply saved choice from cookie (if any)
        (function(){
          var choice = ${choiceJs};
          if (!choice) return;
          if (choice === 'all') {
            gtag('consent', 'update', {
              ad_storage: 'granted',
              analytics_storage: 'granted',
              ad_user_data: 'granted',
              ad_personalization: 'granted'
            });
          } else if (choice === 'analytics') {
            gtag('consent', 'update', { analytics_storage: 'granted' });
          } else if (choice === 'deny') {
            gtag('consent', 'update', {
              ad_storage: 'denied',
              analytics_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied'
            });
          }
        })();
      `}
    </Script>
  );
}
