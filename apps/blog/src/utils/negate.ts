import isEmpty from 'lodash-es/isEmpty'
import negate from 'lodash-es/negate'

export const isNotEmpty = negate(isEmpty) as <T>(v?: T) => v is NonNullable<T>
