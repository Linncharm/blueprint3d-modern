import type { NextConfig } from 'next'
import path from 'path'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Add alias for parent directory src files
    config.resolve.alias = {
      ...config.resolve.alias,
      '@src': path.resolve(__dirname, '../src'),
    }

    // Allow .js extension imports from node_modules (for Three.js addons)
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts', '.tsx'],
    }

    return config
  },

  // Configure Turbopack aliases
  turbopack: {
    resolveAlias: {
      '@src': '../src',
    },
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
  },

  // Disable strict mode temporarily for debugging
  reactStrictMode: false,

  // Transpile Three.js examples (they use ESM with .js extensions)
  transpilePackages: ['three'],
}

export default withNextIntl(nextConfig)
