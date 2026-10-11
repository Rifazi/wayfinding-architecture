// Database connection. SQLite in memory by default, so the example needs no
// database server; set DB_FILE to keep data between runs. Switch `type` to
// 'postgres' for production. The schema is built from every domain's entities.
import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { Customer } from './customers/model.ts'
import { PricingSettings } from './pricing/model.ts'
import { CustomerPrice } from './pricing/customer-prices/model.ts'
import { Promotion } from './pricing/promotions/model.ts'
import { Sale } from './pricing/sales/model.ts'
import { ShippingRate } from './shipping/model.ts'
import { OrderTotalSnapshot } from './order-total/model.ts'

export const db = new DataSource({
  type: 'better-sqlite3',
  database: process.env.DB_FILE ?? ':memory:',
  entities: [Customer, PricingSettings, CustomerPrice, Promotion, Sale, ShippingRate, OrderTotalSnapshot],
  synchronize: true, // creates the tables from the entities; use migrations in production
})
