import { createClient } from '@supabase/supabase-js'
import assert from 'assert'

assert(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  'Missing env var: NEXT_PUBLIC_SUPABASE_URL'
)
assert(process.env.SERVICE_KEY, 'Missing env var: SERVICE_KEY')

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SERVICE_KEY
)
