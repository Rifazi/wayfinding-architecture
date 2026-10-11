import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity('shipping_rates')
export class ShippingRate {
  @PrimaryColumn('text') region: string
  @Column('integer') flatCents: number
  @Column('integer') freeOverCents: number
}
