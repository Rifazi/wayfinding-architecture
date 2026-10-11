import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity('customers')
export class Customer {
  @PrimaryColumn('text') id: string
  @Column('text') name: string
  @Column('text') region: string
  @Column('integer') lifetimeSpendCents: number
}
