import type { ReactNode } from 'react'
import { useState } from 'react'
import type { GetStaticProps, InferGetStaticPropsType } from 'next'
import { VStack, ListItem, HStack } from '@channel.io/bezier-react'
import {
  BookCoverIcon,
  ChatProgressIcon,
  PageIcon,
} from '@channel.io/bezier-icons'
import Link from 'next/link'
import { Set } from 'immutable'
import assert from 'assert'
import { supabase } from '@/supabase/server'
import type { Enums } from '@/supabase/types'
import { PageHeader } from '@/components/PageHeader'
import { PostCategoryCheckbox } from '@/features/blog/component/PostCategoryCheckbox'
import { PostListError } from '@/features/blog/component/PostListError'
import { SiteLayout } from '@/layouts/SiteLayout/SiteLayout'

export const getStaticProps = (async () => {
  const { data: posts } = await supabase
    .from('Article')
    .select('id, title, description, category, created_at')
    .order('created_at', { ascending: false })
    .eq('stage', 'PUBLIC')
    .throwOnError()

  assert(posts !== null, 'posts is null, expected array')
  return {
    props: {
      posts,
    },
    revalidate: 1 * 60 * 60,
  }
}) satisfies GetStaticProps

export default function Page({
  posts,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const [selectedCategories, setSelectedCategories] = useState<
    Set<Enums<'BlogCategory'> | null>
  >(Set(['TECHNICAL', 'JOURNAL']))

  const handleCheckedChange =
    (category: Enums<'BlogCategory'>) => (checked: boolean) =>
      setSelectedCategories((prev) =>
        checked ? prev.add(category) : prev.delete(category)
      )

  const filteredPosts = posts.filter(({ category }) =>
    selectedCategories.has(category)
  )

  const isCategoryNotSelected = selectedCategories.size === 0
  const isEmptyPosts = filteredPosts.length === 0

  return (
    <VStack spacing={16}>
      <PageHeader
        title="/blog"
        description="개인적인 감상들과 기술적인 이야기들, 그리고 메모들을 담아놓았습니다."
      >
        <HStack
          wrap
          as="nav"
          spacing={24}
          style={{ rowGap: 0 }}
        >
          <PostCategoryCheckbox
            checked={selectedCategories.has('TECHNICAL')}
            onCheckedChange={handleCheckedChange('TECHNICAL')}
            help="보통 기술과 관련된 내용들을 적어둡니다."
            icon={PageIcon}
            label="기술 블로그"
          />

          <PostCategoryCheckbox
            checked={selectedCategories.has('JOURNAL')}
            onCheckedChange={handleCheckedChange('JOURNAL')}
            help="기술 블로그에서 다루지 못하는 여러가지 생각들을 담습니다."
            icon={ChatProgressIcon}
            label="생각"
          />

          <PostCategoryCheckbox
            checked={selectedCategories.has('NOTE')}
            onCheckedChange={handleCheckedChange('NOTE')}
            help="500자 미만의 토막글을 보통 다룹니다."
            icon={BookCoverIcon}
            label="메모"
          />
        </HStack>
      </PageHeader>

      <VStack>
        {filteredPosts.map((post) => {
          const IconMap = {
            DEFAULT: PageIcon,
            TECHNICAL: PageIcon,
            JOURNAL: ChatProgressIcon,
            NOTE: BookCoverIcon,
          }

          return (
            <Link
              key={post.id}
              href={`/blog/${post.id}`}
            >
              <ListItem
                leftContent={IconMap[post.category ?? 'DEFAULT']}
                content={post.title}
                description={post.description}
                rightContent={post.created_at}
              />
            </Link>
          )
        })}

        {isCategoryNotSelected && (
          <PostListError>카테고리를 1개 이상 선택해주세요.</PostListError>
        )}

        {!isCategoryNotSelected && isEmptyPosts && (
          <PostListError>아직 작성된 글이 없는것 같네요 ^_^;;</PostListError>
        )}
      </VStack>
    </VStack>
  )
}

Page.getLayout = (page: ReactNode) => (
  <SiteLayout title="/blog">{page}</SiteLayout>
)
