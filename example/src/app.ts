import express, { type ErrorRequestHandler } from 'express'
import { routes as customers } from './customers/routes/routes.ts'
import { routes as pricing } from './pricing/routes/routes.ts'
import { routes as checkout } from './checkout/routes/routes.ts'
import { routes as invoice } from './invoice/routes/routes.ts'

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
