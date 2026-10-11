import { Router } from 'express'
import { customerFor, loyaltyTierFor } from './service.ts'

export const routes = Router()

routes.get('/:id', async (req, res) => {
  res.json(await customerFor(req.params.id))
})

routes.get('/:id/loyalty-tier', async (req, res) => {
  res.json({ tier: await loyaltyTierFor(req.params.id) })
})
