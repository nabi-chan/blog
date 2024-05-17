import { Suspense, type PropsWithChildren } from 'react'
import { Box, HStack, Spinner } from '@channel.io/bezier-react'
import type { BaseLayoutProps } from '@/layouts/BaseLayout/BaseLayout'
import { BaseLayout } from '@/layouts/BaseLayout/BaseLayout'
import { Sidebar } from './Sidebar'
import { AdminGuard } from './AdminGuard'

export interface AdminLayoutProps extends BaseLayoutProps {}

export function AdminLayout({
  title,

  children,

  ...props
}: PropsWithChildren<AdminLayoutProps>) {
  return (
    <Suspense
      fallback={
        <HStack
          justify="center"
          align="center"
        >
          <Spinner
            size="l"
            color="txt-black-dark"
          />
        </HStack>
      }
    >
      <AdminGuard />
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
    </Suspense>
  )
}
