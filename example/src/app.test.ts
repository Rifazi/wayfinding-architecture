import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { app } from './app.ts'
import { setupDb } from './seed.ts'

let server: Server
let base = ''

before(async () => {
  await setupDb()
  server = app.listen(0)
  base = `http://localhost:${(server.address() as AddressInfo).port}`
})
after(() => server.close())

test('checkout over HTTP, then fetch the invoice', async () => {
  const order = await fetch(`${base}/checkout`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      customerId: 'c-ben',
      region: 'CA',
      items: [{ productId: 'p-mug', quantity: 2 }],
      at: '2026-10-15',
    }),
  }).then((r) => r.json())

  assert.equal(order.total.total, 5_254)

  const invoice = await fetch(`${base}/invoices/${order.orderId}`).then((r) => r.json())
  assert.equal(invoice.lines.at(-1), `${'Total'.padEnd(10)}${'$52.54'.padStart(10)}`)
})
