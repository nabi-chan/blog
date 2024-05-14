import type { ReactNode } from 'react'
import { BaseLayout } from '@/layouts/BaseLayout/BaseLayout'
import { SiteLayout } from '@/layouts/SiteLayout/SiteLayout'

export function getSiteLayout(
  page: ReactNode,
  {
    layout,
    title,
    description,
  }: { layout: string; title: string; description: string }
) {
  switch (layout) {
    case 'SITE':
      return (
        <SiteLayout
          title={title}
          description={description}
        >
          {page}
        </SiteLayout>
      )
    case 'EMPTY':
    default:
      return (
        <BaseLayout
          title={title}
          description={description}
        >
          <main>{page}</main>
        </BaseLayout>
      )
  }
}
