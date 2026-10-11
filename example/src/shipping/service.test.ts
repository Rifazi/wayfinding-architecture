import { before, test } from 'node:test'
import assert from 'node:assert/strict'
import { setupDb } from '../seed.ts'
import { chargeFor } from './service.ts'

before(setupDb)

test('free shipping at or above the threshold', async () => {
  assert.equal((await chargeFor(7_500, 'TX')).amount, 0)
})

test('flat rate below the threshold', async () => {
  assert.equal((await chargeFor(7_499, 'TX')).amount, 799)
})
