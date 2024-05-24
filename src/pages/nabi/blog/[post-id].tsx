import type { ReactNode } from 'react'
import {
  Box,
  Button,
  ButtonGroup,
  KeyValueItem,
  KeyValueMultiLineItem,
  VStack,
} from '@channel.io/bezier-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import assert from 'assert'
import { AdminLayout } from '@/layouts/AdminLayout/AdminLayout'
import { PageHeader } from '@/components/PageHeader'
import { supabase } from '@/supabase/server'
import { Viewer } from '@/features/Viewer/components/Viewer'
import { useDeleteArticleMutation } from '@/features/blog/queries/useDeleteArticleMutation'

export const getServerSideProps = (async (context) => {
  assert(context.params, 'context.params is empty, expected object')
  const { data: post } = await supabase
    .from('Article')
    .select('title, description, category, stage, content, created_at')
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
  }
}) satisfies GetServerSideProps

export default function Page({
  post: {
    title,
    description,

    category,
    stage,

    content,
  },
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { 'post-id': postId } = useRouter().query

  const { mutateAsync: deleteArticle, isPending: isDeleting } =
    useDeleteArticleMutation()

  return (
    <VStack spacing={12}>
      <PageHeader
        title="블로그 글 상세"
        description="작성한 글을 확인해보아요"
      />

      <KeyValueItem keyContent="제목">{title}</KeyValueItem>
      {description && (
        <KeyValueItem keyContent="설명">{description}</KeyValueItem>
      )}
      <KeyValueItem keyContent="카테고리">{category}</KeyValueItem>
      <KeyValueItem keyContent="공개 상태">{stage}</KeyValueItem>
      <KeyValueMultiLineItem keyContent="블로그 컨텐츠">
        <Box
          borderWidth={1}
          borderRadius="8"
          borderColor="bdr-black-dark"
          padding={8}
        >
          <Viewer markdown={content} />
        </Box>
      </KeyValueMultiLineItem>
      <ButtonGroup justify="end">
        <Link href={`/nabi/blog/editor/${postId}`}>
          <Button
            styleVariant="secondary"
            text="수정하기"
          />
        </Link>
        <Button
          loading={isDeleting}
          onClick={() => deleteArticle({ articleId: postId as string })}
          styleVariant="secondary"
          colorVariant="red"
          text="삭제하기"
        />
      </ButtonGroup>
    </VStack>
  )
}

Page.getLayout = (page: ReactNode) => (
  <AdminLayout title="블로그 글 상세">{page}</AdminLayout>
)
