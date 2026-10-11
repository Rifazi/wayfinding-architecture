import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity('pricing_promotions')
export class Promotion {
  @PrimaryColumn('text') id: string
  @Column('text', { unique: true }) code: string
  @Column('integer') percentOff: number
  @Column('boolean') holiday: boolean
  @Column('datetime') activeFrom: Date
  @Column('datetime', { nullable: true }) activeTo: Date | null
}
