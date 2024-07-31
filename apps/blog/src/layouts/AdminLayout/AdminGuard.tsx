import { useSuspenseQuery } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'
import { useGetUserQueryObject } from '@/features/User/queries/useGetUserQueryObject'
import { Redirect } from '@/components/Redirect/Redirect'

export function AdminGuard({ children }: PropsWithChildren) {
  const { data } = useSuspenseQuery(useGetUserQueryObject())

  if (!data || data.email !== 'account@nabi.kim') {
    return <Redirect to="/nabi/login" />
  }

  return <>{children}</>
}
