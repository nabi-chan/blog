import { HttpStatusCode } from 'axios'

export class ServerError extends Error {
  name = 'ServerError'

  statusCode: HttpStatusCode = HttpStatusCode.InternalServerError
  message: string = ''

  constructor(statusCode: HttpStatusCode, message?: string) {
    super()

    this.statusCode = statusCode
    this.message = message ?? 'Unexpected Server Error'
  }
}
