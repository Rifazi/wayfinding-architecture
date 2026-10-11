import { Router } from 'express'
import { priceFor } from './service.ts'

export const routes = Router()

// POST /prices/quote  { customerId, items, promoCodes?, at? }
routes.post('/quote', async (req, res) => {
  res.json(await priceFor({ ...req.body, at: new Date(req.body.at ?? Date.now()) }))
})
