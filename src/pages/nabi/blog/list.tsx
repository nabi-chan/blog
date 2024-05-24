import type { ReactNode } from 'react'
import { VStack, ListItem, HStack, Button } from '@channel.io/bezier-react'
import { PageIcon, PencilIcon } from '@channel.io/bezier-icons'
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import Link from 'next/link'
import { AdminLayout } from '@/layouts/AdminLayout/AdminLayout'
import { PageHeader } from '@/components/PageHeader'
import { supabase } from '@/supabase/server'
import { PostListError } from '@/features/errors/ListError'

export const getServerSideProps = (async () => {
  const { data: posts } = await supabase
    .from('Article')
    .select('id, title, created_at, updated_at, stage, category')
    .order('created_at', { ascending: false })
    .throwOnError()

  return {
    props: {
      posts: posts ?? [],
    },
  }
}) satisfies GetServerSideProps

export default function Page({
  posts,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const isEmptyPosts = posts.length === 0

  return (
    <VStack spacing={12}>
      <HStack
        spacing={16}
        align="center"
        justify="between"
      >
        <PageHeader
          title="블로그 글 목록"
          description="나비 블로그의 글 목록"
        />

        <Link href="/nabi/blog/create">
          <Button
            colorVariant="monochrome-dark"
            styleVariant="secondary"
            leftContent={PencilIcon}
            text="새로운 글 작성하기"
          />
        </Link>
      </HStack>

      <VStack as="section">
        {posts?.map((post) => (
          <Link
            key={post.id}
            href={`/nabi/blog/${post.id}`}
          >
            <ListItem
              leftContent={PageIcon}
              content={post.title || ''}
              description={`작성일: ${post.created_at} / 상태: ${post.stage} / 카테고리: ${post.category}`}
            />
          </Link>
        ))}

        {isEmptyPosts && (
          <PostListError>
            글이 없습니다. 새로운 글을 작성해보세요.
          </PostListError>
        )}
      </VStack>
    </VStack>
  )
}

Page.getLayout = (page: ReactNode) => (
  <AdminLayout title="블로그 글 목록">{page}</AdminLayout>
)
