/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },

  // In development, proxy /api requests to the local Express backend.
  // In production, everything is on the same origin (Fly.io).
  ...(process.env.NODE_ENV === 'development' && {
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:3001/api/:path*',
        },
      ];
    },
  }),
};

// Static export for production (no Node.js server needed at runtime)
if (process.env.NODE_ENV !== 'development') {
  nextConfig.output = 'export';
}

export default nextConfig;
