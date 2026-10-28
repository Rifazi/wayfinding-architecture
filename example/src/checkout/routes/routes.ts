import { Router } from 'express'
import { startCheckout } from '../service.ts'

export const routes = Router()

routes.post('/', async (req, res) => {
  res.status(201).json(await startCheckout({ ...req.body, at: new Date(req.body.at ?? Date.now()) }))
})
