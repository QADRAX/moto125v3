import "server-only";
import Script from "next/script";

type Props = { gaId: string };

/**
 * Loads gtag.js and initializes GA4.
 */
export default function GATag({ gaId }: Props) {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="beforeInteractive"
      />
      <Script id="gtag-init" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', {
            send_page_view: false,
            transport_type: 'beacon',
            ads_data_redaction: true
        });
        `}
      </Script>
    </>
  );
}
