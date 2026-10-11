import { Column, Entity, PrimaryColumn } from 'typeorm'

// A junction may hold its own data: the total as it was when the order was placed.
@Entity('order_total_snapshots')
export class OrderTotalSnapshot {
  @PrimaryColumn('text') orderId: string
  @Column('integer') subtotal: number
  @Column('integer') discount: number
  @Column('integer') shipping: number
  @Column('integer') tax: number
  @Column('integer') total: number
}
