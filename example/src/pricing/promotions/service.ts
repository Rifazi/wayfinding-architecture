import { db } from '../../db.ts'
import { Promotion } from './model.ts'

// What pricing sees: the result of the decision, not the Promotion row.
export type AppliedPromotion = {
  code: string
  amount: number // cents, already calculated for this order
}

export async function promotionFor(codes: string[], subtotal: number, at: Date): Promise<AppliedPromotion | null> {
  // One promo code per order.
  if (codes.length > 1) throw new Error('Only one promo code per order')
  if (codes.length === 0) return null

  const promotion = await db.getRepository(Promotion).findOneBy({ code: codes[0] })
  if (!promotion) return null

  // A promotion applies only between its active_from and active_to dates.
  const active = at >= promotion.activeFrom && (promotion.activeTo === null || at < promotion.activeTo)
  if (!active) return null

  // A promotion is a percentage of the subtotal, rounded to the cent.
  return { code: promotion.code, amount: Math.round((subtotal * promotion.percentOff) / 100) }
}
