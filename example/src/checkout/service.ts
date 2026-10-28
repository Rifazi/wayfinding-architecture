import { randomUUID } from 'node:crypto'
import { snapshotTotal, type OrderRequest, type OrderTotal } from '../order-total/service.ts'

export type CheckoutResult = { orderId: string; total: OrderTotal }

export async function startCheckout(request: OrderRequest): Promise<CheckoutResult> {
  if (request.items.length === 0 || request.items.some((item) => item.quantity <= 0)) {
    throw new Error('Cannot check out an empty order')
  }
  const orderId = `o-${randomUUID()}`
  return { orderId, total: await snapshotTotal(orderId, request) }
}
