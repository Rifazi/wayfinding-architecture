import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity('order_total_snapshots')
export class OrderTotalSnapshot {
  @PrimaryColumn('text') orderId: string
  @Column('integer') subtotal: number
  @Column('integer') discount: number
  @Column('integer') shipping: number
  @Column('integer') tax: number
  @Column('integer') total: number
}
