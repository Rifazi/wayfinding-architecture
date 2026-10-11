// Checkout consumes order-total; it never combines pricing, shipping, and tax itself.
import { randomUUID } from 'node:crypto'
import { snapshotTotal, type OrderRequest, type OrderTotal } from '../order-total/service.ts'

export type CheckoutResult = { orderId: string; total: OrderTotal }

export async function startCheckout(request: OrderRequest): Promise<CheckoutResult> {
  // An order must contain at least one item with a positive quantity.
  if (request.items.length === 0 || request.items.some((item) => item.quantity <= 0)) {
    throw new Error('Cannot check out an empty order')
  }
  const orderId = `o-${randomUUID()}`
  return { orderId, total: await snapshotTotal(orderId, request) }
}
