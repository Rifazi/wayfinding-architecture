import { test } from 'node:test'
import assert from 'node:assert/strict'
import { taxFor } from './service.ts'

test("tax uses the region's rate", () => {
  assert.equal(taxFor(10_000, 'TX').amount, 825)
  assert.equal(taxFor(10_000, 'CA').amount, 725)
  assert.throws(() => taxFor(10_000, 'ZZ'))
})

test('tax is rounded to the nearest cent', () => {
  assert.equal(taxFor(1_001, 'TX').amount, 83)
})
