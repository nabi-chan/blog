import { AdminLayout } from '@/layouts/AdminLayout/AdminLayout'
import { ReactNode } from 'react'

export default function Page() {
  return <></>
}

Page.getLayout = (page: ReactNode) => (
  <AdminLayout title="커스텀 페이지 수정하기">{page}</AdminLayout>
)
