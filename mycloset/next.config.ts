import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://ksbaigzlkmhsejarwazu.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable__6EZFXaXFeKv3kmamPUM9w_cfd5mbWL',
  },
};

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
