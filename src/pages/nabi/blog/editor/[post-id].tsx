import type { ReactNode } from 'react'
import {
  Box,
  Button,
  ButtonGroup,
  FormControl,
  FormLabel,
  ListItem,
  Select,
  TextField,
  VStack,
} from '@channel.io/bezier-react'
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import assert from 'assert'
import { AdminLayout } from '@/layouts/AdminLayout/AdminLayout'
import { PageHeader } from '@/components/PageHeader'
import { supabase } from '@/supabase/server'

export const getServerSideProps = (async (context) => {
  assert(context.params, 'context.params is empty, expected object')
  const { data: post } = await supabase
    .from('Article')
    .select('title, description, category, stage, content')
    .eq('id', context.params['post-id'] as string)
    .single()

  return {
    props: {
      post,
    },
  }
}) satisfies GetServerSideProps

export default function Page({
  post,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <VStack
      as="form"
      spacing={12}
      onSubmit={() => {}}
    >
      <PageHeader title="블로그 글 작성/수정" />

      <FormControl labelPosition="left">
        <FormLabel>제목</FormLabel>
        <TextField
          placeholder="블로그 글의 제목을 입력해주세요."
          defaultValue={post?.title}
        />
      </FormControl>

      <FormControl labelPosition="left">
        <FormLabel>설명</FormLabel>
        <TextField
          placeholder="블로그 글을 한줄로 설명해주세요."
          defaultValue={post?.description ?? undefined}
        />
      </FormControl>

      <FormControl>
        <FormLabel>컨텐츠</FormLabel>
        <Box
          padding={32}
          backgroundColor="bg-black-darker"
        >
          여기에 에디터 넣기
        </Box>
      </FormControl>

      <FormControl labelPosition="left">
        <FormLabel>공개 상태</FormLabel>
        <Select
          placeholder="공개 상태를 선택해주세요"
          text={post?.stage ?? undefined}
          dropdownStyle={{ padding: 8, width: '100%' }}
        >
          <ListItem content="모두에게 공개" />
          <ListItem content="링크가 있는 사용자에게 공개" />
          <ListItem content="공개하지 않음" />
        </Select>
      </FormControl>

      <FormControl labelPosition="left">
        <FormLabel>카테고리</FormLabel>
        <Select
          placeholder="카테고리를 선택해주세요"
          text={post?.category ?? undefined}
          dropdownStyle={{ padding: 8, width: '100%' }}
        >
          <ListItem content="기술 블로그" />
          <ListItem content="생각" />
          <ListItem content="메모" />
        </Select>
      </FormControl>

      <ButtonGroup justify="end">
        <Button
          text="미리보기"
          styleVariant="secondary"
        />
        <Button text="저장하기" />
      </ButtonGroup>
    </VStack>
  )
}

Page.getLayout = (page: ReactNode) => (
  <AdminLayout title="블로그 글 작성">{page}</AdminLayout>
)
