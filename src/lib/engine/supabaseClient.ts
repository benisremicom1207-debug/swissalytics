/**
 * Supabase client singleton.
 *
 * Uses the SERVICE_ROLE key (full DB access, bypasses RLS).
 * Only safe to import from server-side code (API routes, lib code
 * called from server). Never expose this client to the browser.
 *
 * Guarded against Next.js hot-reload by attaching to globalThis.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

declare global {
  // eslint-disable-next-line no-var
  var __saSupabase: SupabaseClient | undefined;
}

export function getSupabaseClient(): SupabaseClient {
  if (globalThis.__saSupabase) return globalThis.__saSupabase;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Supabase not configured: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required.',
    );
  }

  globalThis.__saSupabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: 'public' },
  });
  return globalThis.__saSupabase;
}
