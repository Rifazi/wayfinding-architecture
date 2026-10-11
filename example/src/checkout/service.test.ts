import { before, test } from 'node:test'
import assert from 'node:assert/strict'
import { setupDb } from '../seed.ts'
import { startCheckout } from './service.ts'
import { orderTotal } from '../order-total/service.ts'

before(setupDb)

const request = {
  customerId: 'c-ana',
  region: 'TX',
  items: [{ productId: 'p-kettle', quantity: 1 }],
  at: new Date('2026-10-15'),
}

test('empty order cannot check out', async () => {
  await assert.rejects(startCheckout({ ...request, items: [] }))
})

test('checkout total comes from order-total', async () => {
  assert.deepEqual((await startCheckout(request)).total, await orderTotal(request))
})
