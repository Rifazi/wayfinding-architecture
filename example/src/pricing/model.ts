import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity('pricing_settings')
export class PricingSettings {
  @PrimaryColumn('integer') id: number
  @Column('integer') discountCapCents: number
}
