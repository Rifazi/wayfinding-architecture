import { Router } from 'express'
import { priceFor } from '../service.ts'

export const routes = Router()

routes.post('/quote', async (req, res) => {
  res.json(await priceFor({ ...req.body, at: new Date(req.body.at ?? Date.now()) }))
})
