import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/index.html',
        permanent: false,
      },
      {
        source: '/members-students-demo.html',
        destination: '/login',
        permanent: false,
      },
    ]
  },
}

export default nextConfig
