import { AssertionError } from 'assert'

export class UnExpectedValueAssertionError extends AssertionError {
  name = 'UnExpectedAssertionError'

  constructor(message: string) {
    super({ message })
  }
}

export function unExpectedValueAssert(
  condition: boolean,
  message: string
): asserts condition {
  if (!condition) {
    throw new UnExpectedValueAssertionError(message)
  }
}
