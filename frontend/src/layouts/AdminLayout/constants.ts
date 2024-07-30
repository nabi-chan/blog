import { PageIcon, PencilIcon, type BezierIcon } from '@channel.io/bezier-icons'

type SidebarLink = {
  icon: BezierIcon
  title: string
  slug: string
  links: {
    href: string
    title: string
  }[]
}

export const ADMIN_SIDEBAR_LINKS: SidebarLink[] = [
  {
    icon: PencilIcon,
    title: '블로그',
    slug: '/nabi/blog',
    links: [
      {
        href: '/list',
        title: '글 목록',
      },
      {
        href: '/create',
        title: '글 작성',
      },
    ],
  },
  {
    icon: PageIcon,
    title: '커스텀 페이지',
    slug: '/nabi/custom-pages',
    links: [
      {
        href: '/list',
        title: '페이지 목록',
      },
      {
        href: '/create',
        title: '페이지 작성',
      },
    ],
  },
]
