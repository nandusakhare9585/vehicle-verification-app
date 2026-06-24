/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the workspace root to this folder (a stray lockfile exists in the home
  // directory, which would otherwise confuse Next's root inference).
  turbopack: {
    root: __dirname,
  },
  images: {
    // Remote car images may come from these hosts. Add your provider's host here.
    remotePatterns: [
      { protocol: "https", hostname: "**.carimagery.com" },
      { protocol: "http", hostname: "**.carimagery.com" },
      { protocol: "https", hostname: "cdn.imagin.studio" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**" },
    ],
  },
};

module.exports = nextConfig;
