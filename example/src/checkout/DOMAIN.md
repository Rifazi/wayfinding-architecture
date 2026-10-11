# checkout

Parent: none (top-level domain)
Owns: the checkout flow; whether an order can be placed
Owns data: none
Child domains: none
Does not own: the order total (see order-total)
Interface: startCheckout()   (HTTP: POST /checkout)
Checkpoint: npm run checkpoint -- checkout

## Rules
- An order must contain at least one item with a positive quantity.
  Enforced by: service.test.ts › "empty order cannot check out"
- Checkout shows the total from order-total and never computes its own.
  Enforced by: service.test.ts › "checkout total comes from order-total"

## Hidden behavior
- none known

## Recipes
### Add a checkout validation
1. Add the check at the top of startCheckout() in service.ts
2. Add a test named after the rule in service.test.ts
3. Add the rule to "Rules" with its test

## Mirrors
- none

## Consumers
<!-- generated: do not edit -->
- none
<!-- end generated -->
