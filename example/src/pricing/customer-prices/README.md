# customer-prices

Kind: child domain
Parent: pricing
Owns: each product's unit price for a given customer (list or contract price)
Owns data: pricing_customer_prices
Does not own: promotions, sales, the discount cap (see pricing)
Interface: pricedItemsFor()   (used only inside pricing)
Checkpoint: npm run checkpoint -- pricing/customer-prices

## Rules
- A customer's contract price replaces the list price.
  Why: negotiated B2B contracts.
  Enforced by: service.test.ts › "contract price replaces list price"
- An unknown product is an error, never a zero price.
  Enforced by: service.test.ts › "unknown product is rejected"

## Hidden behavior
- A row with no customer ID is the list price.
- Contract prices are entered by the sales team in the admin tool and take
  effect immediately; there is no approval step.

## Recipes
### Add a contract price
1. Insert a row with the customer's ID into pricing_customer_prices
2. Add a case to service.test.ts if the contract has a new shape

## Consumers
<!-- generated: do not edit -->
- pricing
<!-- end generated -->
