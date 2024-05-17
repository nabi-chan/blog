import type { NextApiRequest, NextApiResponse } from 'next'
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

      await res.revalidate(`/blog`)
      if (req.query['post-id'] === undefined) {
        await res.revalidate(`/blog/${req.query['post-id']}`)
      }
      return res.status(200).send('ok')
    }

    default: {
      return res.status(405).send('Method Not Allowed')
    }
  }
}
