import { Column, Entity, PrimaryColumn } from 'typeorm'

// One row. Finance changes the cap here without a code change.
@Entity('pricing_settings')
export class PricingSettings {
  @PrimaryColumn('integer') id: number
  @Column('integer') discountCapCents: number
}
