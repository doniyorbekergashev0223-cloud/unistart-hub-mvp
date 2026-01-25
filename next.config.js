/** @type {import('next').NextConfig} */
const nextConfig = {

  // Prisma uchun webpack konfiguratsiyasi
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        '@prisma/client': '@prisma/client',
      })
    }
    return config
  },
}

module.exports = nextConfig
