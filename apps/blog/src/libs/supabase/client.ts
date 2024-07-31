import { createClient } from '@supabase/supabase-js'
import assert from 'assert'
import type { Database } from './types'

assert(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  'Missing env var: NEXT_PUBLIC_SUPABASE_URL'
)
assert(
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  'Missing env var: NEXT_PUBLIC_SUPABASE_ANON_KEY'
)

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)
