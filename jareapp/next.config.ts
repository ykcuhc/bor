import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // Allow DiceBear avatars and Supabase Storage in <Image> components
    remotePatterns: [
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
};

export default nextConfig;
