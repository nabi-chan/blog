import type { ReactNode } from 'react'
import { Text } from '@channel.io/bezier-react'
import { AdminLayout } from '@/layouts/AdminLayout/AdminLayout'

export default function Page() {
  return (
    <>
      <Text>Hello, World!</Text>
    </>
  )
}

Page.getLayout = (page: ReactNode) => (
  <AdminLayout title="메인">{page}</AdminLayout>
)
