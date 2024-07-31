import type { ErrorBoundaryFallbackProps } from '@suspensive/react'
import { ErrorBoundary } from '@suspensive/react'
import type { PropsWithChildren } from 'react'
import DisplayError from './DisplayError'

type ErrorFallbackProps = ErrorBoundaryFallbackProps

function ErrorFallback({ error, reset }: ErrorFallbackProps) {
  return (
    <DisplayError
      error={error}
      reset={reset}
    />
  )
}

type ClientErrorBoundaryProps = PropsWithChildren

export default function ClientErrorBoundary({
  children,
}: ClientErrorBoundaryProps) {
  return <ErrorBoundary fallback={ErrorFallback}>{children}</ErrorBoundary>
}
