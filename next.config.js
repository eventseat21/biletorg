/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },
  images: {
    domains: ['localhost'],
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), 'canvas']
    return config
  },
}

module.exports = nextConfig
