import { first } from 'lodash-es'
import type { NextPageContext } from 'next'
import DisplayError from 'Components/Error/DisplayError'
import type { ServerError } from 'Server/errors/ServerError'

type ErrorPageProps = {
  statusCode: number
  error: ServerError | Error | null
}

export default function ErrorPage({ statusCode, error }: ErrorPageProps) {
  return (
    <DisplayError
      title={`/${statusCode}/`}
      error={error}
    />
  )
}

ErrorPage.getInitialProps = ({
  res: response,
  err: error = null,
}: NextPageContext): ErrorPageProps => ({
  statusCode: first([response, error])?.statusCode ?? 500,
  error: error ? { name: error.name, message: error.message } : null,
})
