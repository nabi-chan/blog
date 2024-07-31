import { HttpStatusCode } from 'axios'

export class ServerError extends Error {
  name = 'ServerError'

  status: HttpStatusCode = HttpStatusCode.InternalServerError
  message: string = ''

  constructor(status: HttpStatusCode, message: string) {
    super()

    this.status = status
    this.message = message
  }
}
