import { In } from 'typeorm'
import { db } from '../../db.ts'
import { CustomerPrice } from './model.ts'

export type ItemRequest = { productId: string; quantity: number }
export type PricedItem = ItemRequest & { unitPrice: number }

export async function pricedItemsFor(customerId: string, items: ItemRequest[]): Promise<PricedItem[]> {
  const rows = await db.getRepository(CustomerPrice).findBy({
    productId: In(items.map((item) => item.productId)),
  })

  return items.map((item) => {
    const forProduct = rows.filter((row) => row.productId === item.productId)
    const row =
      forProduct.find((r) => r.customerId === customerId) ?? forProduct.find((r) => r.customerId === null)
    if (!row) throw new Error(`Unknown product: ${item.productId}`)
    return { ...item, unitPrice: row.unitPriceCents }
  })
}
