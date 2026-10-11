import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity('pricing_sales')
export class Sale {
  @PrimaryColumn('text') id: string
  @Column('text') productId: string
  @Column('integer') percentOff: number
  @Column('datetime') startsAt: Date
  @Column('datetime') endsAt: Date
}
