import { Column, Entity, PrimaryColumn } from 'typeorm'

// A row with no customerId is the list price.
@Entity('pricing_customer_prices')
export class CustomerPrice {
  @PrimaryColumn('text') id: string
  @Column('text', { nullable: true }) customerId: string | null
  @Column('text') productId: string
  @Column('integer') unitPriceCents: number
}
