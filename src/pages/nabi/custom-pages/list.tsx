import { PageIcon } from '@channel.io/bezier-icons'
import {
  VStack,
  HStack,
  Button,
  ListItem,
  Badge,
} from '@channel.io/bezier-react'
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { isEmpty } from 'lodash'
import { supabase } from '@/supabase/server'
import { AdminLayout } from '@/layouts/AdminLayout/AdminLayout'
import { ListError } from '@/features/errors/ListError/ListError'
import { PageHeader } from '@/components/PageHeader'

export const getServerSideProps = (async () => {
  const { data: customPages } = await supabase
    .from('CustomPage')
    .select('id, title, description, created_at, updated_at, slug')
    .order('created_at', { ascending: false })
    .throwOnError()

  return {
    props: {
      customPages: customPages ?? [],
    },
  }
}) satisfies GetServerSideProps

export default function Page({
  customPages,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const isEmptyPages = customPages.length === 0

  return (
    <VStack spacing={12}>
      <HStack
        spacing={16}
        align="center"
        justify="between"
      >
        <PageHeader
          title="커스텀 페이지 목록"
          description="커스텀 페이지 목록"
        />

        <Link href="/nabi/custom-pages/create">
          <Button
            colorVariant="monochrome-dark"
            styleVariant="secondary"
            leftContent={PageIcon}
            text="새로운 페이지"
          />
        </Link>
      </HStack>

      <VStack as="section">
        {customPages?.map((page) => (
          <Link
            key={page.id}
            href={`/nabi/custom-pages/${page.id}`}
          >
            <ListItem
              leftContent={PageIcon}
              content={page.title || ''}
              description={
                <HStack
                  wrap
                  spacing={4}
                >
                  {!isEmpty(page.description) && (
                    <Badge>description : {page.description}</Badge>
                  )}
                  <Badge>slug : /{page.slug}</Badge>
                  <Badge>created_at : {page.created_at}</Badge>
                </HStack>
              }
            />
          </Link>
        ))}

        {isEmptyPages && <ListError>페이지가 없습니다.</ListError>}
      </VStack>
    </VStack>
  )
}

Page.getLayout = (page: ReactNode) => (
  <AdminLayout title="커스텀 페이지 목록">{page}</AdminLayout>
)
