// Pricing combines its children: the customer's price, then the better of
// any promotion or sale, then the cap on the total discount.
import { db } from '../db.ts'
import { PricingSettings } from './model.ts'
import { pricedItemsFor } from './customer-prices/service.ts'
import { promotionFor } from './promotions/service.ts'
import { saleFor } from './sales/service.ts'

export type Item = { productId: string; quantity: number }

export type PriceRequest = {
  customerId: string
  items: Item[]
  promoCodes?: string[]
  at: Date
}

export type Discount = { amount: number } // cents, after the cap

export type Price = {
  subtotal: number // cents, at the customer's prices
  discount: Discount
  total: number
}

export async function priceFor(request: PriceRequest): Promise<Price> {
  const lines = await pricedItemsFor(request.customerId, request.items)
  const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0)

  const promotion = await promotionFor(request.promoCodes ?? [], subtotal, request.at)
  const sale = await saleFor(lines, request.at)
  const settings = await db.getRepository(PricingSettings).findOneByOrFail({ id: 1 })

  // A promotion and a sale never stack; the customer gets the better one.
  const best = Math.max(promotion?.amount ?? 0, sale?.amount ?? 0)
  // The total discount is capped (pricing_settings, $50 by default).
  const amount = Math.min(best, settings.discountCapCents)

  return { subtotal, discount: { amount }, total: subtotal - amount }
}

export async function discountFor(request: PriceRequest): Promise<Discount> {
  return (await priceFor(request)).discount
}
