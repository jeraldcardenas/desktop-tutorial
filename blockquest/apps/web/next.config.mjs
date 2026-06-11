/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@blockquest/shared'],
  reactStrictMode: false, // Phaser owns its own lifecycle; double-mount in dev breaks the canvas
};

export default nextConfig;
