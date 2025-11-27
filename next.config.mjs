/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      // Add your Supabase project hostname here if using Supabase storage images with Next.js Image
      // Example: { protocol: 'https', hostname: 'your-project.supabase.co' },
    ],
  },
};

export default nextConfig;
