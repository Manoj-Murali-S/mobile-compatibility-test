/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.BUILD_MODE === 'export' ? 'export' : undefined,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
