import { db } from '../db.ts'
import { OrderTotalSnapshot } from './model.ts'
import { priceFor, type PriceRequest } from '../pricing/service.ts'
import { chargeFor } from '../shipping/service.ts'
import { taxFor } from '../tax/service.ts'

export type OrderRequest = PriceRequest & { region: string }

export type OrderTotal = {
  subtotal: number
  discount: number
  shipping: number
  tax: number
  total: number
}

export async function combine(
  subtotal: number,
  discount: number,
  shippingFor: (eligibleSubtotal: number) => Promise<number>,
  taxFor: (taxable: number) => number,
): Promise<OrderTotal> {
  const discounted = Math.max(0, subtotal - discount)
  const shipping = await shippingFor(discounted)
  const tax = taxFor(discounted + shipping)
  return { subtotal, discount: subtotal - discounted, shipping, tax, total: discounted + shipping + tax }
}

export async function orderTotal(request: OrderRequest): Promise<OrderTotal> {
  const price = await priceFor(request)
  return combine(
    price.subtotal,
    price.discount.amount,
    async (eligible) => (await chargeFor(eligible, request.region)).amount,
    (taxable) => taxFor(taxable, request.region).amount,
  )
}

export async function snapshotTotal(orderId: string, request: OrderRequest): Promise<OrderTotal> {
  const total = await orderTotal(request)
  await db.getRepository(OrderTotalSnapshot).insert({ orderId, ...total })
  return total
}

export async function totalForOrder(orderId: string): Promise<OrderTotal> {
  const snapshot = await db.getRepository(OrderTotalSnapshot).findOneBy({ orderId })
  if (!snapshot) throw new Error(`No total for order: ${orderId}`)
  const { subtotal, discount, shipping, tax, total } = snapshot
  return { subtotal, discount, shipping, tax, total }
}
