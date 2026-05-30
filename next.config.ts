import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  devIndicators: false,
  async redirects() {
    return [
      {
        source: '/index.html',
        destination: '/',
        permanent: true,
      },
      {
        source: '/members-students-demo.html',
        destination: '/login?next=/members/students',
        permanent: false,
      },
      {
        source: '/students.html',
        destination: '/students',
        permanent: true,
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/index.html',
      },
    ]
  },
}

export default nextConfig
