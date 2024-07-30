import type { PropsWithChildren } from 'react'
import { Box } from '@channel.io/bezier-react'
import type { BaseLayoutProps } from '@/layouts/BaseLayout/BaseLayout'
import { BaseLayout } from '@/layouts/BaseLayout/BaseLayout'
import { Navbar } from './Navbar'

export interface SiteLayoutProps extends BaseLayoutProps {}

export function SiteLayout({
  title,

  children,

  ...props
}: PropsWithChildren<SiteLayoutProps>) {
  return (
    <BaseLayout
      title={`고양이집 : ${title}`}
      {...props}
    >
      <Box padding={24}>
        <Navbar />
        <Box
          as="main"
          maxWidth="72rem"
          marginHorizontal="auto"
          padding={16}
        >
          {children}
        </Box>
      </Box>
    </BaseLayout>
  )
}
