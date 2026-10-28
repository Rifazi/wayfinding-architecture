import { In } from 'typeorm'
import { db } from '../../db.ts'
import { Sale } from './model.ts'

export type SaleLine = { productId: string; quantity: number; unitPrice: number }
export type AppliedSale = { products: string[]; amount: number }

export async function saleFor(lines: SaleLine[], at: Date): Promise<AppliedSale | null> {
  const sales = await db.getRepository(Sale).findBy({ productId: In(lines.map((l) => l.productId)) })
  const active = sales.filter((s) => s.startsAt <= at && at < s.endsAt)

  let amount = 0
  const products: string[] = []
  for (const line of lines) {
    const sale = active.find((s) => s.productId === line.productId)
    if (!sale) continue
    amount += Math.round((line.unitPrice * line.quantity * sale.percentOff) / 100)
    products.push(line.productId)
  }
  return amount > 0 ? { products, amount } : null
}
