import { db } from '../db.ts'
import { ShippingRate } from './model.ts'

export type ShippingCharge = { amount: number } // cents

// eligibleSubtotal is decided by the caller: order-total decides which subtotal counts.
export async function chargeFor(eligibleSubtotal: number, region: string): Promise<ShippingCharge> {
  const rate = await db.getRepository(ShippingRate).findOneBy({ region })
  if (!rate) throw new Error(`No shipping rate for region: ${region}`)
  // Free at or above the region's threshold; otherwise the flat rate.
  return { amount: eligibleSubtotal >= rate.freeOverCents ? 0 : rate.flatCents }
}
