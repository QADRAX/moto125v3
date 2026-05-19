/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  serverExternalPackages: [
    "@moto125/content-cache",
    "@moto125/content-cache-worker",
    "@moto125/content-cache-core",
    "@moto125/api-client",
  ],
  async rewrites() {
    return [
      {
        source: "/sitemap/:id.xml",
        destination: "/sitemaps/:id",
      },
    ];
  },
};

export default config;
