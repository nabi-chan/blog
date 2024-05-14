import { useState, type ReactNode } from 'react'
import type { GetStaticProps, InferGetStaticPropsType } from 'next'
import {
  VStack,
  Text,
  ListItem,
  HStack,
  Checkbox,
  Icon,
  Tooltip,
} from '@channel.io/bezier-react'
import {
  BookCoverIcon,
  ChatProgressIcon,
  PageIcon,
} from '@channel.io/bezier-icons'
import Link from 'next/link'
import { Set } from 'immutable'
import assert from 'assert'
import { SiteLayout } from '@/layouts/SiteLayout/SiteLayout'
import { supabase } from '@/supabase/server'
import type { Enums } from '@/supabase/types'

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
      <VStack spacing={8}>
        <Text
          typo="18"
          bold
        >
          /blog
        </Text>
        <Text
          typo="14"
          color="txt-black-darker"
        >
          개인적인 감상들과 기술적인 이야기들, 그리고 메모들을 담아놓았습니다.
        </Text>

        <HStack
          spacing={24}
          as="nav"
        >
          <Checkbox
            checked={selectedCategories.has('TECHNICAL')}
            onCheckedChange={handleCheckedChange('TECHNICAL')}
          >
            <Tooltip content="보통 기술과 관련된 내용들을 적어둡니다.">
              <HStack
                spacing={4}
                align="center"
              >
                <Icon
                  source={PageIcon}
                  color="txt-black-dark"
                  size="s"
                />
                기술 블로그
              </HStack>
            </Tooltip>
          </Checkbox>
          <Checkbox
            checked={selectedCategories.has('JOURNAL')}
            onCheckedChange={handleCheckedChange('JOURNAL')}
          >
            <Tooltip content="기술 블로그에서 다루지 못하는 여러가지 생각들을 담습니다.">
              <HStack
                spacing={4}
                align="center"
              >
                <Icon
                  source={ChatProgressIcon}
                  color="txt-black-dark"
                  size="s"
                />
                생각
              </HStack>
            </Tooltip>
          </Checkbox>
          <Checkbox
            checked={selectedCategories.has('NOTE')}
            onCheckedChange={handleCheckedChange('NOTE')}
          >
            <Tooltip content="500자 미만의 토막글을 보통 다룹니다.">
              <HStack
                spacing={4}
                align="center"
              >
                <Icon
                  source={BookCoverIcon}
                  color="txt-black-dark"
                  size="s"
                />
                메모
              </HStack>
            </Tooltip>
          </Checkbox>
        </HStack>
      </VStack>

      <VStack>
        {filteredPosts.map((post) => {
          const IconMap = {
            TECHNICAL: PageIcon,
            JOURNAL: ChatProgressIcon,
            NOTE: BookCoverIcon,
            DEFAULT: PageIcon,
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
          <VStack paddingVertical={24}>
            <Text
              typo="14"
              color="txt-black-darker"
              align="center"
            >
              보고싶은 카테고리를 1개 이상 선택해주세요.
            </Text>
          </VStack>
        )}

        {!isCategoryNotSelected && isEmptyPosts && (
          <VStack paddingVertical={24}>
            <Text
              typo="14"
              color="txt-black-darker"
              align="center"
            >
              아직 작성된 글이 없는것 같네요 ^_^;;
            </Text>
          </VStack>
        )}
      </VStack>
    </VStack>
  )
}

Page.getLayout = (page: ReactNode) => (
  <SiteLayout title="/blog">{page}</SiteLayout>
)
