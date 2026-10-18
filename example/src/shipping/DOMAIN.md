# shipping

Owns: shipping charge for a region; free-shipping thresholds
Owns data: shipping_rates
Does not own: which subtotal counts toward the threshold (see order-total)
Interface: chargeFor()
Checkpoint: npm run checkpoint -- shipping

## Rules
- Shipping is free at or above the region's threshold.
  Enforced by: service.test.ts › "free shipping at or above the threshold"
- Below the threshold, shipping is the region's flat rate.
  Enforced by: service.test.ts › "flat rate below the threshold"

## Recipes
### Change a region's threshold
1. Update the row in shipping_rates
2. Run the checkpoint, then order-total's checkpoint

## Files
<!-- generated: files, do not edit -->
- `service.ts` (interface):
  - `type ShippingCharge = {amount: number}`
  - `chargeFor(eligibleSubtotal: number, region: string): Promise<ShippingCharge>`
- `model.ts`: ShippingRate
- tests: `service.test.ts`
<!-- end generated -->

## Consumers
<!-- generated: do not edit -->
- order-total
<!-- end generated -->
