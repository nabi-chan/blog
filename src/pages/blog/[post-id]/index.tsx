import { VStack, Box, Text } from '@channel.io/bezier-react'
import type {
  GetStaticPaths,
  GetStaticProps,
  InferGetStaticPropsType,
} from 'next'
import type { ReactNode } from 'react'
import assert from 'assert'
import { supabase } from '@/supabase/server'
import { PageHeader } from '@/components/PageHeader'
import { SiteLayout } from '@/layouts/SiteLayout/SiteLayout'

export const getStaticPaths = (async () => {
  const { data: posts } = await supabase
    .from('Article')
    .select('id')
    .neq('stage', 'PRIVATE')
    .neq('stage', 'DRAFT')
    .throwOnError()

  assert(posts !== null, 'posts is null, expected array')
  return {
    paths: posts.map(({ id }) => ({
      params: {
        'post-id': id,
      },
    })),
    fallback: false,
  }
}) satisfies GetStaticPaths

export const getStaticProps = (async (context) => {
  assert(context.params, 'context.params is empty, expected object')
  const { data: post } = await supabase
    .from('Article')
    .select('title, description, content, created_at')
    .eq('id', context.params['post-id'] as string)
    .single()
    .throwOnError()

  if (post === null) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      post,
    },
    revalidate: 1 * 60 * 60,
  }
}) satisfies GetStaticProps

export default function Page({
  post: { title, description, content, created_at },
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <VStack spacing={16}>
      <PageHeader
        title={title}
        description={description}
      >
        <Text
          typo="12"
          color="txt-black-darker"
        >
          {created_at}에 나비가 작성했어요. 다 읽는데 10분이 걸려요.
        </Text>
      </PageHeader>

      <Box
        style={{ fontSize: 'initial' }}
        dangerouslySetInnerHTML={{
          __html: `<pre>${JSON.stringify(content, null, 2)}</pre>`,
        }}
      />
    </VStack>
  )
}

Page.getLayout = (
  page: ReactNode,
  pageProps: InferGetStaticPropsType<typeof getStaticProps>
) => {
  return (
    <SiteLayout
      title={pageProps.post.title}
      description={pageProps.post.description ?? undefined}
    >
      {page}
    </SiteLayout>
  )
}
