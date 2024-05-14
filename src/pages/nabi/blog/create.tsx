import type { GetServerSideProps } from 'next'
import assert from 'assert'
import { supabase } from '@/supabase/server'

export const getServerSideProps = (async () => {
  const { data } = await supabase
    .from('Article')
    .insert({ title: '새 글', description: '', content: [] })
    .select('id')
    .single()
    .throwOnError()

  assert(data, 'Data should be exist')
  return {
    redirect: {
      destination: `/nabi/blog/editor/${data.id}`,
      permanent: false,
    },
  }
}) satisfies GetServerSideProps

export default function Page() {
  return <></>
}
