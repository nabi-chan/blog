import type { NextApiRequest, NextApiResponse } from 'next'
import { isNull, toNumber } from 'lodash'
import { supabase } from '@/supabase/server'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case 'PATCH': {
      const { authorization } = req.headers
      if (!authorization) {
        return res.status(401).send('Unauthorized')
      }

      const token = authorization.replace('Bearer ', '')
      const user = await supabase.auth.getUser(token)
      if (user.error) {
        return res.status(403).send('Forbidden')
      }

      if (!user.data) {
        return res.status(404).send('Not Found')
      }

      const pageId = toNumber(req.query.pageId)
      const { data: page } = await supabase
        .from('CustomPage')
        .select('slug')
        .eq('id', pageId)
        .single()
        .throwOnError()

      if (isNull(page)) {
        return res.status(404).send('Not Found')
      }

      await res.revalidate(`/${page?.slug}`)
      return res.status(200).send('ok')
    }

    default: {
      return res.status(405).send('Method Not Allowed')
    }
  }
}
