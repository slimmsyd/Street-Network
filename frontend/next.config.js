/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'teal-artistic-bonobo-612.mypinata.cloud',
      'gateway.pinata.cloud',
      'api.dicebear.com'
    ],
  },
  experimental: {
    serverActions: true,
  },
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    NEXT_PUBLIC_PROJECT_ID: process.env.NEXT_PUBLIC_PROJECT_ID,
  },
  async headers() {
    return [
      {
        source: '/api/auth/discord/callback',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        util: require.resolve('util/'),
        buffer: require.resolve('buffer/'),
      };
      config.plugins.push(
        new config.webpack.ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer'],
        }),
      );
    }
    return config;
  },
}

module.exports = nextConfig