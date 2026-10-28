const RATES: Record<string, number> = {
  TX: 0.0825,
  CA: 0.0725,
}

export type Tax = { rate: number; amount: number }

export function taxFor(taxableAmount: number, region: string): Tax {
  const rate = RATES[region]
  if (rate === undefined) throw new Error(`No tax rate for region: ${region}`)
  return { rate, amount: Math.round(taxableAmount * rate) }
}
