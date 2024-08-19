/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  experimental: {
    urlImports: ['https://cdnjs.cloudflare.com', 'https://cdn.jsdelivr.net'],
  },
  rewrites: () => [
    {
      source: '/content/:slug*',
      destination: `${process.env.GHOST_API_URL}/content/:slug*`,
    },
  ],
}

export default nextConfig
