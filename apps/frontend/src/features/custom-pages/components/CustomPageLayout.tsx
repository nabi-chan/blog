import type { PropsWithChildren } from 'react'
import { Box } from '@channel.io/bezier-react'
import type { Tables } from '@/supabase/types'
import { BaseLayout } from '@/layouts/BaseLayout/BaseLayout'
import { SiteLayout } from '@/layouts/SiteLayout/SiteLayout'

interface CustomPageLayoutProps {
  title: string
  description: string | null
  layout: Tables<'CustomPage'>['layout']
}

export function CustomPageLayout({
  title,
  description,
  layout,
  children,
}: PropsWithChildren<CustomPageLayoutProps>) {
  switch (layout) {
    case 'SITE': {
      return (
        <SiteLayout
          title={title}
          description={description ?? undefined}
        >
          {children}
        </SiteLayout>
      )
    }

    case 'WIDE': {
      return (
        <BaseLayout
          title={title}
          description={description ?? undefined}
        >
          <Box
            as="main"
            padding={24}
          >
            {children}
          </Box>
        </BaseLayout>
      )
    }

    case 'BASE': {
      return (
        <BaseLayout
          title={title}
          description={description ?? undefined}
        >
          <Box
            as="main"
            padding={24}
            maxWidth="72rem"
            marginHorizontal="auto"
          >
            {children}
          </Box>
        </BaseLayout>
      )
    }

    case 'EMPTY':
    default: {
      return (
        <BaseLayout
          title={title}
          description={description ?? undefined}
        >
          {children}
        </BaseLayout>
      )
    }
  }
}
