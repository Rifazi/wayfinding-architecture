import { totalForOrder, type OrderTotal } from '../order-total/service.ts'

export type Invoice = { orderId: string; lines: string[] }

export function money(cents: number): string {
  const sign = cents < 0 ? '-' : ''
  return `${sign}$${(Math.abs(cents) / 100).toFixed(2)}`
}

export function layout(total: OrderTotal): string[] {
  const rows: [string, number][] = [['Subtotal', total.subtotal]]
  if (total.discount > 0) rows.push(['Discount', -total.discount])
  rows.push(['Shipping', total.shipping], ['Tax', total.tax], ['Total', total.total])
  return rows.map(([label, cents]) => `${label.padEnd(10)}${money(cents).padStart(10)}`)
}

export async function renderInvoice(orderId: string): Promise<Invoice> {
  return { orderId, lines: layout(await totalForOrder(orderId)) }
}
