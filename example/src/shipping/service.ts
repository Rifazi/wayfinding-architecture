import { db } from '../db.ts'
import { ShippingRate } from './model.ts'

export type ShippingCharge = { amount: number }

export async function chargeFor(eligibleSubtotal: number, region: string): Promise<ShippingCharge> {
  const rate = await db.getRepository(ShippingRate).findOneBy({ region })
  if (!rate) throw new Error(`No shipping rate for region: ${region}`)
  return { amount: eligibleSubtotal >= rate.freeOverCents ? 0 : rate.flatCents }
}
