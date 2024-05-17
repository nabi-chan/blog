import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'PATCH': {
      res.revalidate(`/blog`)
      res.revalidate(`/blog/${req.query['post-id']}`)
      return res.status(200).send('ok')
    }

    default: {
      return res.status(405).send('Method Not Allowed')
    }
  }
}
