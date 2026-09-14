import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/calculators',
        destination: 'https://biet-sgpa-auto.vercel.app/',
        permanent: false,
      },
      {
        source: '/calculators/:path*',
        destination: 'https://biet-sgpa-auto.vercel.app/',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
