// Tax stores no data. In production, rates come from the tax provider.
const RATES: Record<string, number> = {
  TX: 0.0825,
  CA: 0.0725,
}

export type Tax = { rate: number; amount: number } // amount in cents

export function taxFor(taxableAmount: number, region: string): Tax {
  // Tax uses the region's rate; an unknown region is an error.
  const rate = RATES[region]
  if (rate === undefined) throw new Error(`No tax rate for region: ${region}`)
  // Tax is rounded to the nearest cent.
  return { rate, amount: Math.round(taxableAmount * rate) }
}
