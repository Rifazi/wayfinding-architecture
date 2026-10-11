// The Express app: mounts each top-level domain's routes, nothing else.
import express, { type ErrorRequestHandler } from 'express'
import { routes as customers } from './customers/routes.ts'
import { routes as pricing } from './pricing/routes.ts'
import { routes as checkout } from './checkout/routes.ts'
import { routes as invoice } from './invoice/routes.ts'

export const app = express()
app.use(express.json())

app.use('/customers', customers)
app.use('/prices', pricing)
app.use('/checkout', checkout)
app.use('/invoices', invoice)

const onError: ErrorRequestHandler = (err, _req, res, _next) => {
  res.status(400).json({ error: err instanceof Error ? err.message : String(err) })
}
app.use(onError)
