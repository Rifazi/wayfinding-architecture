# sales

Parent: pricing
Owns: time-limited markdowns on products
Owns data: pricing_sales
Child domains: none
Does not own: customer prices, promotions, the discount cap (see pricing)
Interface: saleFor(lines, at)   (used only inside pricing)
Checkpoint: npm run checkpoint -- pricing/sales

## Rules
- A sale applies only inside its window (starts_at inclusive, ends_at exclusive).
  Enforced by: service.test.ts › "sale applies only inside its window"
- A sale marks down only its own product's line.
  Enforced by: service.test.ts › "sale marks down only its product"

## Hidden behavior
- none known

## Recipes
### Schedule a sale
1. Insert a row into pricing_sales with the product and window
2. Run the checkpoint

## Mirrors
- none

## Consumers
<!-- generated: do not edit -->
- pricing
<!-- end generated -->
