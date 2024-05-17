import { useRef, type ReactNode } from 'react'
import type { SelectRef } from '@channel.io/bezier-react'
import {
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
import { useFormik } from 'formik'
import { useRouter } from 'next/router'
import assert from 'assert'
import { AdminLayout } from '@/layouts/AdminLayout/AdminLayout'
import { PageHeader } from '@/components/PageHeader'
import { supabase } from '@/supabase/server'
import { Editor } from '@/features/Editor/component'
import { useUpdateArticleMutation } from '@/features/Editor/queries/useUpdateArticleMutation'

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
  const stageDropdownRef = useRef<SelectRef>(null)
  const categoryDropdownRef = useRef<SelectRef>(null)

  const { query, push } = useRouter()

  const { mutateAsync, isPending } = useUpdateArticleMutation()

  const { handleSubmit, values, handleChange, setFieldValue } = useFormik({
    initialValues: {
      title: post?.title ?? '',
      description: post?.description ?? '',
      content: post?.content ?? '',
      stage: post?.stage ?? 'PUBLIC',
      category: post?.category ?? 'TECHNICAL',
    },
    onSubmit: async (article) => {
      await mutateAsync({
        articleId: query['post-id'] as string,
        article,
      })
      push('/nabi/blog/list')
    },
  })

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={12}>
        <PageHeader title="블로그 글 작성/수정" />

        <FormControl labelPosition="left">
          <FormLabel>제목</FormLabel>
          <TextField
            placeholder="블로그 글의 제목을 입력해주세요."
            name="title"
            value={values.title}
            onChange={handleChange}
          />
        </FormControl>

        <FormControl labelPosition="left">
          <FormLabel>설명</FormLabel>
          <TextField
            placeholder="블로그 글을 한줄로 설명해주세요."
            name="description"
            value={values.description}
            onChange={handleChange}
          />
        </FormControl>

        <FormControl>
          <FormLabel>컨텐츠</FormLabel>
          <Editor
            name="content"
            value={values.content}
            onChange={handleChange}
          />
        </FormControl>

        <FormControl labelPosition="left">
          <FormLabel>공개 상태</FormLabel>
          <Select
            text={values.stage}
            ref={stageDropdownRef}
            placeholder="공개 상태를 선택해주세요"
            dropdownStyle={{ padding: 8, width: '100%' }}
          >
            <ListItem
              onClick={() => {
                setFieldValue('stage', 'PUBLIC')
                stageDropdownRef.current?.handleHideDropdown()
              }}
              content="모두에게 공개"
            />
            <ListItem
              onClick={() => {
                setFieldValue('stage', 'LINK_ONLY')
                stageDropdownRef.current?.handleHideDropdown()
              }}
              content="링크가 있는 사용자에게 공개"
            />
            <ListItem
              onClick={() => {
                setFieldValue('stage', 'PRIVATE')
                stageDropdownRef.current?.handleHideDropdown()
              }}
              content="공개하지 않음"
            />
          </Select>
        </FormControl>

        <FormControl labelPosition="left">
          <FormLabel>카테고리</FormLabel>
          <Select
            text={values.category}
            ref={categoryDropdownRef}
            placeholder="카테고리를 선택해주세요"
            dropdownStyle={{ padding: 8, width: '100%' }}
          >
            <ListItem
              onClick={() => {
                setFieldValue('category', 'TECHNICAL')
                categoryDropdownRef.current?.handleHideDropdown()
              }}
              content="기술 블로그"
            />
            <ListItem
              onClick={() => {
                setFieldValue('category', 'JOURNAL')
                categoryDropdownRef.current?.handleHideDropdown()
              }}
              content="생각"
            />
            <ListItem
              onClick={() => {
                setFieldValue('category', 'NOTE')
                categoryDropdownRef.current?.handleHideDropdown()
              }}
              content="메모"
            />
          </Select>
        </FormControl>

        <ButtonGroup justify="end">
          <Button
            loading={isPending}
            type="submit"
            text="저장하기"
          />
        </ButtonGroup>
      </VStack>
    </form>
  )
}

Page.getLayout = (page: ReactNode) => (
  <AdminLayout title="블로그 글 작성">{page}</AdminLayout>
)
