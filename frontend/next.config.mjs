/** @type {import('next').NextConfig} */

// The browser only ever talks to this Next.js server at /api/*.
// Next forwards those calls to the FastAPI backend, so there are no CORS problems.
//   browser:  fetch('/api/trades')
//   Next.js:  http://localhost:8000/trades
const BACKEND = process.env.BACKEND_URL || "http://localhost:8000";

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND}/:path*` }];
  },
};

export default nextConfig;
