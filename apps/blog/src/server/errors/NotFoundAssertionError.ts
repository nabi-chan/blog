import { AssertionError } from 'assert'

export class NotFoundAssertionError extends AssertionError {
  name = 'NotFoundAssertionError'

  constructor(message: string) {
    super({ message })
  }
}

export function notFoundAssert(
  condition: boolean,
  message: string
): asserts condition {
  if (!condition) {
    throw new NotFoundAssertionError(message)
  }
}
