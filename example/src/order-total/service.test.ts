import { before, test } from 'node:test'
import assert from 'node:assert/strict'
import { setupDb } from '../seed.ts'
import { combine, orderTotal } from './service.ts'

before(setupDb)

const flatShipping = async (eligible: number) => (eligible >= 7_500 ? 0 : 799)
const tenPercentTax = (taxable: number) => Math.round(taxable * 0.1)

test('discount applies before shipping and tax', async () => {
  const t = await combine(10_000, 1_000, flatShipping, tenPercentTax)
  assert.deepEqual(t, { subtotal: 10_000, discount: 1_000, shipping: 0, tax: 900, total: 9_900 })
})

test('free-shipping threshold uses the discounted subtotal', async () => {
  const t = await combine(8_000, 1_000, flatShipping, tenPercentTax)
  assert.equal(t.shipping, 799)
})

test('total never goes below zero', async () => {
  const t = await combine(1_000, 5_000, async () => 0, tenPercentTax)
  assert.equal(t.discount, 1_000)
  assert.equal(t.total, 0)
})

test('order total combines pricing, shipping, and tax', async () => {
  const t = await orderTotal({
    customerId: 'c-ben',
    region: 'CA',
    items: [{ productId: 'p-mug', quantity: 2 }],
    at: new Date('2026-10-15'),
  })
  assert.deepEqual(t, { subtotal: 3_600, discount: 0, shipping: 1_299, tax: 355, total: 5_254 })
})
