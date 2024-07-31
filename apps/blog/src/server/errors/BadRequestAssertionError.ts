import { AssertionError } from 'assert'

export class BadRequestAssertionError extends AssertionError {
  name = 'BadRequestAssertionError'

  constructor(message: string) {
    super({ message })
  }
}

export function badRequestAssert(
  condition: boolean,
  message: string
): asserts condition {
  if (!condition) {
    throw new BadRequestAssertionError(message)
  }
}
