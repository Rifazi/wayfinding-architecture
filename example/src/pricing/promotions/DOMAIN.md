# promotions

Parent: pricing
Owns: seasonal promotions and promo codes; which promotion applies to an order, and how much
Owns data: pricing_promotions
Child domains: none
Does not own: customer prices, sales, the discount cap (see pricing)
Interface: promotionFor(codes, subtotal, at)   (used only inside pricing)
Checkpoint: npm run checkpoint -- pricing/promotions

## Rules
- A promotion is a percentage of the order subtotal, rounded to the cent.
  Enforced by: service.test.ts › "promotion is a percentage of the subtotal"
- A promotion applies only between its active_from and active_to dates.
  Enforced by: service.test.ts › "expired promotion does not apply"
- One promo code per order.
  Why: marketing policy; codes are not designed to combine.
  Enforced by: service.test.ts › "second promo code is rejected"

## Hidden behavior
- Promo codes are imported nightly from the marketing tool (separate system).
  Direct edits to pricing_promotions are overwritten by the import. A rule
  that must survive the import belongs in service.ts, not in a row.
- Holiday promotions are flagged with the holiday column, set by marketing.

## Recipes
### Add a new kind of promotion
1. Add the rule in service.ts, behind promotionFor()
2. Add a test named after the rule in service.test.ts
3. Add the rule to "Rules" with its test
4. Run the checkpoint, then pricing's checkpoint

## Mirrors
- none

## Consumers
<!-- generated: do not edit -->
- pricing
<!-- end generated -->
