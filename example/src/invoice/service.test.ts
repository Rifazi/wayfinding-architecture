import { before, test } from 'node:test'
import assert from 'node:assert/strict'
import { setupDb } from '../seed.ts'
import { layout, money, renderInvoice } from './service.ts'
import { startCheckout } from '../checkout/service.ts'

before(setupDb)

test('invoice lines appear in a fixed order', () => {
  const lines = layout({ subtotal: 6_500, discount: 1_300, shipping: 799, tax: 495, total: 6_494 })
  assert.deepEqual(lines.map((l) => l.split(' ')[0]), ['Subtotal', 'Discount', 'Shipping', 'Tax', 'Total'])
})

test('amounts are shown in dollars with two decimals', () => {
  assert.equal(money(6_494), '$64.94')
  assert.equal(money(-1_300), '-$13.00')
})

test('invoice reads the snapshot taken at checkout', async () => {
  const { orderId, total } = await startCheckout({
    customerId: 'c-ana',
    region: 'TX',
    items: [{ productId: 'p-kettle', quantity: 1 }],
    at: new Date('2026-10-15'),
  })
  assert.deepEqual((await renderInvoice(orderId)).lines, layout(total))
})
