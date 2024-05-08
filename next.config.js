/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  redirects: () => [
    {
      source: '/post',
      destination: '/posts',
      permanent: true,
    },
  ],
}

export default nextConfig
