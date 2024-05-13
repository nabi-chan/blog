import type { PropsWithChildren } from 'react'
import { Box, HStack } from '@channel.io/bezier-react'
import type { BaseLayoutProps } from '@/layouts/BaseLayout/BaseLayout'
import { BaseLayout } from '@/layouts/BaseLayout/BaseLayout'
import { Sidebar } from './Sidebar'

export interface AdminLayoutProps extends BaseLayoutProps {}

export function AdminLayout({
  title,

  children,

  ...props
}: PropsWithChildren<AdminLayoutProps>) {
  return (
    <BaseLayout
      noindex
      title={`고양이집 : ${title}`}
      {...props}
    >
      <HStack>
        <Sidebar />
        <Box
          as="main"
          maxWidth="72rem"
          width="100%"
          marginHorizontal="auto"
          padding={16}
        >
          {children}
        </Box>
      </HStack>
    </BaseLayout>
  )
}
