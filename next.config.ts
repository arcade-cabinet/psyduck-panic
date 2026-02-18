import type { NextConfig } from 'next';

const isGitHubPages = process.env.GITHUB_PAGES === 'true';
const repoName = 'cognitive-dissonance';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['reactylon', '@babylonjs/core', '@babylonjs/loaders', '@babylonjs/gui'],
  turbopack: {
    resolveAlias: {
      // Ensure single React instance to avoid "ReactCurrentBatchConfig" errors
      react: 'react',
      'react-dom': 'react-dom',
    },
  },
  // Static export for GitHub Pages deployment
  ...(isGitHubPages && {
    output: 'export',
    trailingSlash: true,
    images: { unoptimized: true },
    basePath: `/${repoName}`,
    assetPrefix: `/${repoName}/`,
  }),
};

export default nextConfig;
