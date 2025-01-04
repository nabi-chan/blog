import { HttpStatusCode } from 'axios'
import { redirect } from 'Features/short-links/redirect'
import get from 'lodash-es/get'
import type { GetServerSidePropsContext } from 'next'
import { NotFoundAssertionError } from 'Server/errors/NotFoundAssertionError'
import { ServerError } from 'Server/errors/ServerError'

export async function getServerSideProps({
  params,
}: GetServerSidePropsContext) {
  try {
    return {
      redirect: {
        destination: await redirect(params?.slug),
      },
    }
  } catch (error) {
    if (error instanceof NotFoundAssertionError) {
      return {
        notFound: true,
      }
    }

    throw new ServerError(
      HttpStatusCode.InternalServerError,
      get(error, 'message')
    )
  }
}
