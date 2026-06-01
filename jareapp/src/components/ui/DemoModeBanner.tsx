// Shown when NEXT_PUBLIC_SUPABASE_URL is not configured.
// Tells the developer they're seeing local dummy data and explains
// how to switch to a real database.

export default function DemoModeBanner() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm flex items-start gap-2.5">
      <span className="text-xl flex-shrink-0 mt-0.5">🧪</span>
      <div>
        <p className="font-semibold text-amber-800">Demo Mode — using local dummy data</p>
        <p className="text-amber-700 mt-0.5 text-xs">
          Copy <code className="bg-amber-100 rounded px-1">.env.local.example</code> to{' '}
          <code className="bg-amber-100 rounded px-1">.env.local</code> and add your Supabase
          credentials to connect a live database. Run{' '}
          <code className="bg-amber-100 rounded px-1">supabase/schema.sql</code> then{' '}
          <code className="bg-amber-100 rounded px-1">supabase/seed.sql</code> in the Supabase SQL
          editor to bootstrap the schema.
        </p>
      </div>
    </div>
  );
}
