import type { ReactNode } from 'react'
import { Text } from '@channel.io/bezier-react'
import { SiteLayout } from '@/layouts/SiteLayout/SiteLayout'

export default function Page() {
  return (
    <>
      <Text>Hello, World!</Text>
    </>
  )
}

Page.getLayout = (page: ReactNode) => (
  <SiteLayout title="메인">{page}</SiteLayout>
)