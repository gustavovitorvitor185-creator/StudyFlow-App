import { createClient } from '@supabase/supabase-js'

const url = (
  import.meta.env.VITE_SUPABASE_URL || import.meta.env.vite_supabase_url
)?.trim()
const publishableKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.vite_supabase_publishable_key
)?.trim()

export const isSupabaseConfigured = Boolean(url && publishableKey)

export const supabase = isSupabaseConfigured
  ? createClient(url!, publishableKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null
