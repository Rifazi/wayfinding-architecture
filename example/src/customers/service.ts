import { db } from '../db.ts'
import { Customer } from './model.ts'

export type LoyaltyTier = 'none' | 'silver' | 'gold'

export type CustomerProfile = { id: string; name: string; region: string }

async function findCustomer(id: string): Promise<Customer> {
  const customer = await db.getRepository(Customer).findOneBy({ id })
  if (!customer) throw new Error(`Unknown customer: ${id}`)
  return customer
}

export async function customerFor(id: string): Promise<CustomerProfile> {
  const { name, region } = await findCustomer(id)
  return { id, name, region }
}

export async function loyaltyTierFor(id: string): Promise<LoyaltyTier> {
  const customer = await findCustomer(id)
  if (customer.lifetimeSpendCents >= 100_000) return 'gold'
  if (customer.lifetimeSpendCents >= 25_000) return 'silver'
  return 'none'
}
