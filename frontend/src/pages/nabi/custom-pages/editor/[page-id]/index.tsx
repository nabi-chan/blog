import {
  FormControl,
  FormGroup,
  FormLabel,
  TextField,
  Text,
  ButtonGroup,
  Button,
  TextArea,
  VStack,
} from '@channel.io/bezier-react'
import { useFormik } from 'formik'
import type { ChangeEvent, ReactNode } from 'react'
import { useCallback } from 'react'
import { useRouter } from 'next/router'
import { toNumber } from 'lodash-es'
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import assert from 'assert'
import { Editor } from '@/features/Editor/component'
import { FileField } from '@/features/Editor/component/FileField'
import { Select } from '@/features/Editor/component/Select'
import { AdminLayout } from '@/layouts/AdminLayout/AdminLayout'
import type { Enums } from '@/supabase/types'
import { useUpdatePageMutation } from '@/features/custom-pages/queries/useUpdatePageMutation'
import { supabase } from '@/supabase/server'
import { PageHeader } from '@/components/PageHeader'

export interface CustomPageFormValues {
  title: string
  description: string
  slug: string
  type: Enums<'PageType'>
  layout: Enums<'PageLayout'>
  content: string
}

export const getServerSideProps = (async (context) => {
  assert(context.params, 'context.params is empty, expected object')
  const { data: page } = await supabase
    .from('CustomPage')
    .select('title, description, slug, type, layout, content')
    .eq('id', toNumber(context.params['page-id']))
    .single()

  return {
    props: {
      page,
    },
  }
}) satisfies GetServerSideProps

export default function Page({
  page,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { query, push } = useRouter()
  const { mutateAsync, isPending } = useUpdatePageMutation()

  const formik = useFormik<CustomPageFormValues>({
    initialValues: {
      title: page?.title ?? '',
      description: page?.description ?? '',
      slug: page?.slug ?? '',
      type: page?.type ?? 'MARKDOWN',
      layout: page?.layout ?? 'BASE',
      content: page?.content ?? '',
    },
    onSubmit: async (page) => {
      await mutateAsync({
        pageId: toNumber(query['page-id']),
        page,
      })
      push('/nabi/custom-pages/list')
    },
  })

  const handleFileUpload = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const { files } = event.target
      if (!files) {
        return
      }
      formik.setFieldValue('content', await files[0].text())
    },
    [formik]
  )

  return (
    <form onSubmit={formik.handleSubmit}>
      <FormGroup spacing={12}>
        <PageHeader title="커스텀 페이지 추가/수정" />
        {/* 페이지 제목 */}
        <FormControl labelPosition="left">
          <FormLabel>페이지 제목</FormLabel>
          <TextField
            name="title"
            value={formik.values.title}
            placeholder='예: "커스텀 페이지"'
            onChange={formik.handleChange}
          />
        </FormControl>

        {/* 페이지 설명 */}
        <FormControl labelPosition="left">
          <FormLabel>페이지 설명</FormLabel>
          <TextField
            name="description"
            value={formik.values.description}
            placeholder="페이지에 대한 간단한 설명을 입력해주세요."
            onChange={formik.handleChange}
          />
        </FormControl>

        {/* 페이지 slug */}
        <FormControl labelPosition="left">
          <FormLabel>페이지 링크</FormLabel>
          <TextField
            name="slug"
            leftContent={<Text typo="12">/</Text>}
            value={formik.values.slug}
            placeholder="some-page"
            onChange={formik.handleChange}
          />
        </FormControl>

        {/* 페이지 타입 */}
        <FormControl labelPosition="left">
          <FormLabel>페이지 타입</FormLabel>
          <Select
            name="type"
            value={formik.values.type}
            placeholder="페이지 유형을 선택해주세요."
            onChange={formik.handleChange}
            items={[
              { label: '마크다운 페이지', value: 'MARKDOWN' },
              { label: 'HTML 페이지', value: 'HTML' },
            ]}
          />
        </FormControl>

        {/* 페이지 레이아웃 */}
        <FormControl labelPosition="left">
          <FormLabel>페이지 레이아웃</FormLabel>
          <Select
            name="layout"
            value={formik.values.layout}
            placeholder="페이지 레이아웃을 선택해주세요."
            onChange={formik.handleChange}
            items={[
              { label: '빈 레이아웃', value: 'EMPTY' },
              { label: '기본 레이아웃', value: 'BASE' },
              { label: '넓은 레이아웃', value: 'WIDE' },
              { label: '사이트 레이아웃', value: 'SITE' },
            ]}
          />
        </FormControl>

        {/* 에디터 */}
        {/* 페이지 타입이 마크다운 페이지일 때 */}
        {formik.values.type === 'MARKDOWN' && (
          <FormControl>
            <FormLabel>페이지 컨텐츠</FormLabel>
            <Editor
              name="content"
              placeholder="페이지 내용을 입력해주세요."
              value={formik.values.content}
              onChange={formik.handleChange}
            />
          </FormControl>
        )}

        {/* 페이지 타입이 HTML 페이지일 때 */}
        {formik.values.type === 'HTML' && (
          <FormControl>
            <FormLabel>페이지 컨텐츠</FormLabel>
            <VStack spacing={8}>
              <TextArea
                name="content"
                value={formik.values.content}
                onChange={formik.handleChange}
                minRows={24}
                maxRows={36}
              />
              <FileField
                maxFiles={1}
                name="content"
                accept="text/html"
                onChange={handleFileUpload}
              />
            </VStack>
          </FormControl>
        )}

        <ButtonGroup justify="end">
          <Button
            loading={isPending}
            type="submit"
            text="저장하기"
          />
        </ButtonGroup>
      </FormGroup>
    </form>
  )
}

Page.getLayout = (page: ReactNode) => (
  <AdminLayout title="커스텀 페이지 수정하기">{page}</AdminLayout>
)
