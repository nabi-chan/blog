import { useRouter } from 'next/router'
import { useEffect } from 'react'

interface RedirectProps {
  to: string
}

export function Redirect({ to }: RedirectProps) {
  const router = useRouter()

  useEffect(() => {
    router.push(to)
  }, [router, to])

  return null
}
