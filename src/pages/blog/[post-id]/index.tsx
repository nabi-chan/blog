import type { ReactNode } from 'react'
import { VStack, Text, Box } from '@channel.io/bezier-react'
import type {
  GetStaticPaths,
  GetStaticProps,
  InferGetStaticPropsType,
} from 'next'
import assert from 'assert'
import { SiteLayout } from '@/layouts/SiteLayout/SiteLayout'
import { supabase } from '@/supabase/server'

export const getStaticPaths = (async () => {
  const { data: posts } = await supabase
    .from('Article')
    .select('id')
    .neq('stage', 'PRIVATE')
    .throwOnError()

  assert(posts !== null, 'posts is null, expected array')
  return {
    paths: posts.map(({ id }) => ({
      params: {
        'post-id': id,
      },
    })),
    fallback: true,
    revalidate: 1 * 60 * 60,
  }
}) satisfies GetStaticPaths

export const getStaticProps = (async (context) => {
  assert(context.params, 'context.params is empty, expected object')
  const { data: post } = await supabase
    .from('Article')
    .select('title, description, content')
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
  post: { title, description, content },
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <VStack spacing={16}>
      <VStack spacing={8}>
        <Text
          typo="18"
          bold
        >
          {title}
        </Text>
        <Text
          typo="14"
          color="txt-black-darker"
        >
          {description}
        </Text>
      </VStack>

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
) => (
  <SiteLayout
    title={pageProps.post.title}
    description={pageProps.post.description ?? undefined}
  >
    {page}
  </SiteLayout>
)
