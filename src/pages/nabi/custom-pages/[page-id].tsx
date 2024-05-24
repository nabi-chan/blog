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
import { toNumber } from 'lodash'
import assert from 'assert'
import { AdminLayout } from '@/layouts/AdminLayout/AdminLayout'
import { PageHeader } from '@/components/PageHeader'
import { supabase } from '@/supabase/server'
import { Viewer } from '@/features/Viewer/components/Viewer'

export const getServerSideProps = (async (context) => {
  assert(context.params, 'context.params is empty, expected object')
  const { data: pages } = await supabase
    .from('CustomPage')
    .select('title, description, created_at, content, type, slug')
    .eq('id', toNumber(context.params['page-id']))
    .single()
    .throwOnError()

  if (pages === null) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      pages,
    },
  }
}) satisfies GetServerSideProps

export default function Page({
  pages: {
    title,
    description,

    slug,

    type,
    content,
  },
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { 'page-id': pageId } = useRouter().query

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
      <KeyValueItem keyContent="slug">/{slug}</KeyValueItem>
      <KeyValueMultiLineItem keyContent="컨텐츠">
        <Box
          borderWidth={1}
          borderRadius="8"
          borderColor="bdr-black-dark"
          padding={8}
        >
          {type === 'MARKDOWN' && <Viewer markdown={content ?? ''} />}
          {type === 'HTML' && (
            <div dangerouslySetInnerHTML={{ __html: content ?? '' }} />
          )}
        </Box>
      </KeyValueMultiLineItem>
      <ButtonGroup justify="end">
        <Link href={`/nabi/custom-pages/editor/${pageId}`}>
          <Button
            styleVariant="secondary"
            text="수정하기"
          />
        </Link>
        <Button
          styleVariant="secondary"
          colorVariant="red"
          text="삭제하기"
        />
      </ButtonGroup>
    </VStack>
  )
}

Page.getLayout = (page: ReactNode) => (
  <AdminLayout title="커스텀 페이지 상세">{page}</AdminLayout>
)
