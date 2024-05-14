import type { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import type { ReactNode } from 'react'
import assert from 'assert'
import { supabase } from '@/supabase/server'
import { getSiteLayout } from '@/features/cms/utils/getSiteLayout'
import { Renderer } from '@/features/cms/components/renderer'

export const getServerSideProps = (async (context) => {
  const slug = context.req.url
  assert(typeof slug === 'string', 'slug must be a string')

  const { data } = await supabase
    .from('CustomPage')
    .select('*')
    .eq('slug', slug)
    .single()
    .throwOnError()

  if (data === null) {
    return {
      notFound: true,
    }
  }

  await supabase
    .from('CustomPage')
    .update({ views: data.views + 1 })
    .eq('slug', slug)
    .single()

  const { layout, title, description, content } = data
  return {
    props: {
      layout,

      title,
      description: description ?? '',

      content,
    },
  }
}) satisfies GetServerSideProps

export default function Page({
  layout,

  title,

  description,
  content,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return getSiteLayout(<Renderer html={content} />, {
    layout,
    title,
    description,
  })
}

Page.getLayout = (page: ReactNode) => <>{page}</>
