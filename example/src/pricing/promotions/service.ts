import { db } from '../../db.ts'
import { Promotion } from './model.ts'

export type AppliedPromotion = {
  code: string
  amountCents: number
}

export async function promotionFor(codes: string[], subtotal: number, at: Date): Promise<AppliedPromotion | null> {
  if (codes.length > 1) throw new Error('Only one promo code per order')
  if (codes.length === 0) return null

  const promotion = await db.getRepository(Promotion).findOneBy({ code: codes[0] })
  if (!promotion) return null

  const active = at >= promotion.activeFrom && (promotion.activeTo === null || at < promotion.activeTo)
  if (!active) return null

  return { code: promotion.code, amountCents: Math.round((subtotal * promotion.percentOff) / 100) }
}
