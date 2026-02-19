// TODO: Stub — full implementation provided by S0-B2 (Supabase client configuration)
// This creates a Supabase client with the service role key for server-side admin operations.

import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
