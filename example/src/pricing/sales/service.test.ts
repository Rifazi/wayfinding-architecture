import { before, test } from 'node:test'
import assert from 'node:assert/strict'
import { setupDb } from '../../seed.ts'
import { saleFor } from './service.ts'

before(setupDb)

const kettle = { productId: 'p-kettle', quantity: 1, unitPrice: 6_500 }
const mug = { productId: 'p-mug', quantity: 2, unitPrice: 1_800 }

test('sale applies only inside its window', async () => {
  assert.equal(await saleFor([kettle], new Date('2026-12-01')), null)
  assert.deepEqual(await saleFor([kettle], new Date('2026-10-15')), { products: ['p-kettle'], amount: 1_300 })
})

test('sale marks down only its product', async () => {
  assert.deepEqual(await saleFor([kettle, mug], new Date('2026-10-15')), { products: ['p-kettle'], amount: 1_300 })
})
