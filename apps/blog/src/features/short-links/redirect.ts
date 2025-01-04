import { supabase } from 'Libs/supabase/server'
import { badRequestAssert } from 'Server/errors/BadRequestAssertionError'
import { notFoundAssert } from 'Server/errors/NotFoundAssertionError'
import { isNotEmpty } from 'Utils/negate'

export async function redirect(slug: unknown) {
  badRequestAssert(typeof slug === 'string', 'slug is required')

  const { data } = await supabase
    .from('short_links')
    .select('destination')
    .eq('slug', slug)
    .single()

  notFoundAssert(isNotEmpty(data), 'Short link not found')
  return data.destination
}
