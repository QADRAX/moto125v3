/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  experimental: {
    // habilita Server Actions si las vas a usar
    serverActions: { allowedOrigins: ["*"] }
  }
  // Si luego cambias a next/image, descomenta y ajusta dominios:
  // images: {
  //   remotePatterns: [
  //     { protocol: "http", hostname: "localhost", port: "1337", pathname: "/uploads/**" },
  //     { protocol: "https", hostname: "tudominio-strapi.com", pathname: "/uploads/**" }
  //   ]
  // }
};

export default config;
