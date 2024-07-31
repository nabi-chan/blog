import router, { HttpStatusCode } from 'Server/router'

router.get((_, res) => {
  return res.status(HttpStatusCode.Ok).end('Success')
})

export default router.handler()
