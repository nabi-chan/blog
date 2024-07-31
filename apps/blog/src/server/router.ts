import type { NextApiRequest, NextApiResponse } from 'next'
import { createRouter } from 'next-connect'
import { HttpStatusCode } from 'axios'
import { BadRequestAssertionError } from './errors/BadRequestAssertionError'
import { UnExpectedValueAssertionError } from './errors/UnExpectedValueAssertionError'
import { ServerError } from './errors/ServerError'

const router = createRouter<NextApiRequest, NextApiResponse>()

router.use((_, res, next) => {
  try {
    return next()
  } catch (error) {
    // 잘못된 값
    if (error instanceof BadRequestAssertionError) {
      return res.status(HttpStatusCode.BadRequest).end(error.message)
    }

    // 예상했으나 오류인 값
    if (error instanceof UnExpectedValueAssertionError) {
      return res.status(HttpStatusCode.InternalServerError).end(error.message)
    }

    // 기타 서버 오류
    if (error instanceof ServerError) {
      return res.status(error.status).end(error.message)
    }

    // 진짜 예상 못한 오류
    console.error(error)
    return res
      .status(HttpStatusCode.InternalServerError)
      .end('Unexpected Server Error')
  }
})

export { HttpStatusCode }
export default router
