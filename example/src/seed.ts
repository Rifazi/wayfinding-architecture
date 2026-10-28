import { db } from './db.ts'
import { Customer } from './customers/model.ts'
import { PricingSettings } from './pricing/model.ts'
import { CustomerPrice } from './pricing/customer-prices/model.ts'
import { Promotion } from './pricing/promotions/model.ts'
import { Sale } from './pricing/sales/model.ts'
import { ShippingRate } from './shipping/model.ts'

export async function setupDb() {
  if (!db.isInitialized) await db.initialize()

  await db.getRepository(Customer).save([
    { id: 'c-ana', name: 'Ana Ruiz', region: 'TX', lifetimeSpendCents: 150_000 },
    { id: 'c-ben', name: 'Ben Okafor', region: 'CA', lifetimeSpendCents: 2_000 },
    { id: 'c-acme', name: 'Acme Cafe', region: 'TX', lifetimeSpendCents: 40_000 },
  ])

  await db.getRepository(CustomerPrice).save([
    { id: 'cp-1', customerId: null, productId: 'p-mug', unitPriceCents: 1_800 },
    { id: 'cp-2', customerId: null, productId: 'p-kettle', unitPriceCents: 6_500 },
    { id: 'cp-3', customerId: null, productId: 'p-grinder', unitPriceCents: 24_000 },
    { id: 'cp-4', customerId: 'c-acme', productId: 'p-grinder', unitPriceCents: 20_000 },
  ])

  await db.getRepository(Promotion).save([
    { id: 'pr-1', code: 'WELCOME15', percentOff: 15, holiday: false, activeFrom: new Date('2026-01-01'), activeTo: null },
    { id: 'pr-2', code: 'SPRING5', percentOff: 5, holiday: false, activeFrom: new Date('2026-03-01'), activeTo: new Date('2026-04-01') },
    { id: 'pr-3', code: 'HOLIDAY10', percentOff: 10, holiday: true, activeFrom: new Date('2026-11-20'), activeTo: new Date('2027-01-01') },
  ])

  await db.getRepository(Sale).save([
    { id: 's-1', productId: 'p-kettle', percentOff: 20, startsAt: new Date('2026-10-01'), endsAt: new Date('2026-11-01') },
  ])

  await db.getRepository(PricingSettings).save({ id: 1, discountCapCents: 5_000 })

  await db.getRepository(ShippingRate).save([
    { region: 'TX', flatCents: 799, freeOverCents: 7_500 },
    { region: 'CA', flatCents: 1_299, freeOverCents: 10_000 },
  ])
}
