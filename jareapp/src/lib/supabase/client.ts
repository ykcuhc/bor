import { createBrowserClient } from '@supabase/ssr';
import { IS_DEMO } from '@/lib/constants';

let _client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (IS_DEMO) return null as unknown as ReturnType<typeof createBrowserClient>;
  if (!_client) {
    _client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _client;
}
