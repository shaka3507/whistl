import { createClient } from "@supabase/supabase-js"
import { Database } from "./supabase-types"

// Check for required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing environment variable NEXT_PUBLIC_SUPABASE_URL')
}

if (!supabaseAnonKey) {
  throw new Error('Missing environment variable NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

console.log(`Initializing Supabase client with URL: ${supabaseUrl}`)

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'whistl-auth-token',
  },
  global: {
    headers: {
      'x-application-name': 'whistl',
    },
  },
  // Configure retries and timeouts
  realtime: {
    params: {
      eventsPerSecond: 2, // Limit realtime events rate
    },
  },
})

