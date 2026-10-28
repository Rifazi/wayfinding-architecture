# tax

Kind: domain
Owns: tax rate and tax amount for a region
Does not own: what is taxable in an order (see order-total)
Interface: taxFor()
Checkpoint: npm run checkpoint -- tax

## Rules
- Tax uses the rate for the customer's region; an unknown region is an error.
  Enforced by: service.test.ts › "tax uses the region's rate"
- Tax is rounded to the nearest cent.
  Enforced by: service.test.ts › "tax is rounded to the nearest cent"

## Hidden behavior
- In production, rates are fetched from the tax provider at startup and cached
  for 24 hours. This example hard-codes them in service.ts.

## Recipes
### Add a region
1. Add its rate to RATES in service.ts
2. Add a case to service.test.ts
3. Run the checkpoint

## Consumers
<!-- generated: do not edit -->
- order-total
<!-- end generated -->
