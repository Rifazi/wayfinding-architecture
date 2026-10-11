import { before, test } from 'node:test'
import assert from 'node:assert/strict'
import { setupDb } from '../../seed.ts'
import { pricedItemsFor } from './service.ts'

before(setupDb)

test('contract price replaces list price', async () => {
  const [acme] = await pricedItemsFor('c-acme', [{ productId: 'p-grinder', quantity: 1 }])
  const [ben] = await pricedItemsFor('c-ben', [{ productId: 'p-grinder', quantity: 1 }])
  assert.equal(acme.unitPrice, 20_000)
  assert.equal(ben.unitPrice, 24_000)
})

test('unknown product is rejected', async () => {
  await assert.rejects(pricedItemsFor('c-ben', [{ productId: 'p-nothing', quantity: 1 }]))
})
