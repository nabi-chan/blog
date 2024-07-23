import type {
  GetStaticPaths,
  GetStaticProps,
  InferGetStaticPropsType,
} from 'next'
import { concat, merge } from 'lodash-es'
import type { ReactNode } from 'react'
import assert from 'assert'
import { supabase } from '@/supabase/server'
import { BaseLayout } from '@/layouts/BaseLayout/BaseLayout'
import { renderMarkdown } from '@/features/Viewer/utils/renderMarkdown'
import { Content } from '@/features/Viewer/components/Viewer'
import { CustomPageLayout } from '@/features/custom-pages/components/CustomPageLayout'

export const getStaticPaths = (async () => {
  const { data: pages } = await supabase
    .from('CustomPage')
    .select('slug')
    .throwOnError()

  assert(pages, 'pages is empty, expected array')
  return {
    fallback: 'blocking',
    paths: pages.map(({ slug }) => ({
      params: {
        slug: concat('/', slug.split('/')),
      },
    })),
  }
}) satisfies GetStaticPaths

export const getStaticProps = (async (context) => {
  assert(context.params, 'context.params is empty, expected object')
  const { data: pages } = await supabase
    .from('CustomPage')
    .select('title, description, content, type, layout')
    .eq(
      'slug',
      ((context.params['slug'] as string[] | undefined) ?? []).join('/')
    )
    .single()

  if (pages === null) {
    return {
      revalidate: 1 * 60 * 60,
      notFound: true,
    }
  }

  if (pages.type === 'HTML') {
    return {
      revalidate: 1 * 60 * 60,
      props: {
        pageConfig: pages,
      },
    }
  }

  const renderedContent = await renderMarkdown(pages.content ?? '')

  return {
    revalidate: 1 * 60 * 60,
    props: {
      pageConfig: merge(pages, { content: renderedContent.toString() }),
    },
  }
}) satisfies GetStaticProps

export default function Page({
  pageConfig: { title, description, type, content },
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <BaseLayout
      title={title}
      description={description ?? undefined}
    >
      {type === 'MARKDOWN' && (
        <Content dangerouslySetInnerHTML={{ __html: content ?? '' }} />
      )}
      {type === 'HTML' && (
        <article dangerouslySetInnerHTML={{ __html: content ?? '' }} />
      )}
    </BaseLayout>
  )
}

Page.getLayout = (
  page: ReactNode,
  { pageConfig }: InferGetStaticPropsType<typeof getStaticProps>
) => (
  <CustomPageLayout
    title={pageConfig.title}
    description={pageConfig.description}
    layout={pageConfig.layout}
  >
    {page}
  </CustomPageLayout>
)
