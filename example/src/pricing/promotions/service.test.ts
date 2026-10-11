import { before, test } from 'node:test'
import assert from 'node:assert/strict'
import { setupDb } from '../../seed.ts'
import { promotionFor } from './service.ts'

before(setupDb)

const OCT = new Date('2026-10-15')
const DEC = new Date('2026-12-10')

test('promotion is a percentage of the subtotal', async () => {
  assert.deepEqual(await promotionFor(['WELCOME15'], 10_000, OCT), { code: 'WELCOME15', amount: 1_500 })
})

test('expired promotion does not apply', async () => {
  assert.equal(await promotionFor(['SPRING5'], 10_000, OCT), null)
  assert.equal(await promotionFor(['HOLIDAY10'], 10_000, OCT), null)
  assert.deepEqual(await promotionFor(['HOLIDAY10'], 10_000, DEC), { code: 'HOLIDAY10', amount: 1_000 })
})

test('second promo code is rejected', async () => {
  await assert.rejects(promotionFor(['WELCOME15', 'HOLIDAY10'], 10_000, DEC))
})
