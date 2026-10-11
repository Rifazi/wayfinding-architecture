# pricing

Parent: none (top-level domain)
Owns: final price (customer price, then the better of promotion or sale); discount cap
Owns data: pricing_settings
Child domains: customer-prices, promotions, sales
Does not own: tax, shipping, order total (see order-total); loyalty tier (see customers)
Interface: priceFor(), discountFor()
Checkpoint: npm run checkpoint -- pricing

## Rules
- Pricing starts from the customer's own price (contract or list).
  Enforced by: service.test.ts › "starts from the customer price"
- Discounts are capped at $50 per order (pricing_settings).
  Why: finance policy, Q1 2026.
  Enforced by: service.test.ts › "caps discount at $50"
- A promotion and a sale never stack; the customer gets the better one.
  Enforced by: service.test.ts › "promotion and sale do not stack"

## Hidden behavior
- billing-sync (separate repository) re-prices open invoices nightly
  using discountFor(). Changing its signature breaks billing-sync.

## Recipes
### Add a new pricing factor
1. Create a child domain beside customer-prices, promotions, and sales
2. Combine it in priceFor() in service.ts
3. Add a test named after the new rule in service.test.ts
4. Run the checkpoint and `npm run check`

## Mirrors
- none

## Consumers
<!-- generated: do not edit -->
- order-total
<!-- end generated -->
