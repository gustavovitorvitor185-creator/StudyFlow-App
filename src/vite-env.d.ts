/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
  readonly vite_supabase_url?: string
  readonly vite_supabase_publishable_key?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
