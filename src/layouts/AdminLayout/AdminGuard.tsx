import { useSuspenseQuery } from '@tanstack/react-query'
import { useGetUserQueryObject } from '@/features/User/queries/useGetUserQueryObject'
import { Redirect } from '@/components/Redirect/Redirect'
import { PropsWithChildren } from 'react'

export function AdminGuard({ children }: PropsWithChildren) {
  const { data } = useSuspenseQuery(useGetUserQueryObject())

  if (!data || data.email !== 'account@nabi.kim') {
    return <Redirect to="/nabi/login" />
  }

  return <>{children}</>
}
