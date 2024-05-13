import type { BezierIcon } from '@channel.io/bezier-icons'

type SidebarLink = {
  icon: BezierIcon
  title: string
  slug: string
  links: {
    href: string
    title: string
  }[]
}

export const ADMIN_SIDEBAR_LINKS: SidebarLink[] = []
