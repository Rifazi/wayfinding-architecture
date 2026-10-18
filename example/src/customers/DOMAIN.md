# customers

Owns: customer profile; loyalty tier
Owns data: customers
Does not own: what a customer pays (see pricing)
Interface: customerFor(), loyaltyTierFor()
Checkpoint: npm run checkpoint -- customers

## Rules
- Loyalty tier is earned from lifetime spend: silver from $250, gold from $1,000.
  Why: loyalty program terms, 2026.
  Enforced by: service.test.ts › "loyalty tier comes from lifetime spend"
- An unknown customer ID is an error, never a guest.
  Enforced by: service.test.ts › "unknown customer is rejected"

## Hidden behavior
- Lifetime spend is recalculated nightly by the data warehouse and written back
  to the customers table. A tier change shows up the morning after a purchase.

## Recipes
### Add a loyalty tier
1. Add the tier to LoyaltyTier in service.ts, with its threshold
2. Add a case to the tier test in service.test.ts
3. Update "Rules" and run the checkpoint

## Files
<!-- generated: files, do not edit -->
- `service.ts` (interface):
  - `type LoyaltyTier = 'none' | 'silver' | 'gold'`
  - `type CustomerProfile = {id: string; name: string; region: string}`
  - `customerFor(id: string): Promise<CustomerProfile>`
  - `loyaltyTierFor(id: string): Promise<LoyaltyTier>`
- `model.ts`: Customer
- `routes.ts`: routes
- tests: `service.test.ts`
<!-- end generated -->
