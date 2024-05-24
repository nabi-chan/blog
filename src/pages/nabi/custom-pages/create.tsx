import type { GetServerSideProps } from 'next'
import assert from 'assert'
import { supabase } from '@/supabase/server'
import cuid from 'cuid'

export const getServerSideProps = (async () => {
  const { data } = await supabase
    .from('CustomPage')
    .insert({
      title: '새 페이지',
      slug: `/random-page-${cuid()}`,
      description: '',
      content: '',
    })
    .select('id')
    .single()
    .throwOnError()

  assert(data, 'Data should be exist')
  return {
    redirect: {
      destination: `/nabi/custom-pages/editor/${data.id}`,
      permanent: false,
    },
  }
}) satisfies GetServerSideProps

export default function Page() {
  return <></>
}
