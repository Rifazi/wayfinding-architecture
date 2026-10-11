import { before, test } from 'node:test'
import assert from 'node:assert/strict'
import { setupDb } from '../seed.ts'
import { priceFor } from './service.ts'

before(setupDb)

const OCT = new Date('2026-10-15')
const DEC = new Date('2026-12-10')

test('starts from the customer price', async () => {
  const price = await priceFor({ customerId: 'c-acme', items: [{ productId: 'p-grinder', quantity: 1 }], at: DEC })
  assert.equal(price.subtotal, 20_000)
})

test('caps discount at $50', async () => {
  // 15% of $480 is $72; the cap holds it to $50.
  const price = await priceFor({
    customerId: 'c-ben',
    items: [{ productId: 'p-grinder', quantity: 2 }],
    promoCodes: ['WELCOME15'],
    at: DEC,
  })
  assert.equal(price.discount.amount, 5_000)
  assert.equal(price.total, 43_000)
})

test('promotion and sale do not stack', async () => {
  // Kettle sale is 20% ($13.00); WELCOME15 is 15% ($9.75). The sale wins alone.
  const price = await priceFor({
    customerId: 'c-ben',
    items: [{ productId: 'p-kettle', quantity: 1 }],
    promoCodes: ['WELCOME15'],
    at: OCT,
  })
  assert.equal(price.discount.amount, 1_300)
})
