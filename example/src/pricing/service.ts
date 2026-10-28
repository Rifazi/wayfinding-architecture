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

export type Discount = { amount: number }

export type Price = {
  subtotal: number
  discount: Discount
  total: number
}

export async function priceFor(request: PriceRequest): Promise<Price> {
  const lines = await pricedItemsFor(request.customerId, request.items)
  const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0)

  const promotion = await promotionFor(request.promoCodes ?? [], subtotal, request.at)
  const sale = await saleFor(lines, request.at)
  const settings = await db.getRepository(PricingSettings).findOneByOrFail({ id: 1 })

  const best = Math.max(promotion?.amountCents ?? 0, sale?.amount ?? 0)
  const amount = Math.min(best, settings.discountCapCents)

  return { subtotal, discount: { amount }, total: subtotal - amount }
}

export async function discountFor(request: PriceRequest): Promise<Discount> {
  return (await priceFor(request)).discount
}
