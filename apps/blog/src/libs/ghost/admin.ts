import { TSGhostAdminAPI } from '@ts-ghost/admin-api'
import assert from 'assert'

export const admin = new TSGhostAdminAPI(
  process.env.GHOST_API_URL!,
  process.env.GHOST_ADMIN_KEY!,
  'v5.88.2'
)

type Success = {
  success: true
  data: { key: string; value: unknown }[]
}

type Failure = {
  success: false
  errors: { type: string; message: string }[]
}

export const deserialize = <T extends Success | Failure>(response: T) => {
  assert(response.success, 'failed to fetch ghost admin settings')
  return response.data
    .map(({ key, value }) => ({
      key,
      value:
        typeof value === 'string'
          ? value[0] === '{' || value[0] === '['
            ? JSON.parse(value)
            : value
          : null,
    }))
    .reduce(
      (acc, { key, value }) => ({ ...acc, [key]: value }),
      {} as Record<string, unknown>
    )
}
