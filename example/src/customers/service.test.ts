import { before, test } from 'node:test'
import assert from 'node:assert/strict'
import { setupDb } from '../seed.ts'
import { customerFor, loyaltyTierFor } from './service.ts'

before(setupDb)

test('loyalty tier comes from lifetime spend', async () => {
  assert.equal(await loyaltyTierFor('c-ana'), 'gold')
  assert.equal(await loyaltyTierFor('c-acme'), 'silver')
  assert.equal(await loyaltyTierFor('c-ben'), 'none')
})

test('unknown customer is rejected', async () => {
  await assert.rejects(customerFor('nobody'))
})
