/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    serverActions: { allowedOrigins: ["*"] }
  }
};

export default config;
