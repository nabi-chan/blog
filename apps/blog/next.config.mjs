/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
  },
  experimental: {
    urlImports: ['https://cdnjs.cloudflare.com', 'https://cdn.jsdelivr.net'],
  },
}

export default nextConfig
