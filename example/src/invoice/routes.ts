import { Router } from 'express'
import { renderInvoice } from './service.ts'

export const routes = Router()

routes.get('/:orderId', async (req, res) => {
  res.json(await renderInvoice(req.params.orderId))
})
