# order-total

Kind: junction
Parent: none (top-level domain)
Inputs: pricing.priceFor(), shipping.chargeFor(), tax.taxFor()
Owns: how discount, shipping, and tax combine into an order total; total snapshots
Owns data: order_total_snapshots
Child domains: none
Does not own: how discount, shipping, or tax is calculated (see pricing, shipping, tax)
Interface: orderTotal(), snapshotTotal(), totalForOrder()
Checkpoint: npm run checkpoint -- order-total

## Rules
- Order of application: discount, then shipping, then tax.
  Enforced by: service.test.ts › "discount applies before shipping and tax"
- The free-shipping threshold uses the discounted subtotal.
  Why: finance policy; free shipping is earned on what the customer pays.
  Enforced by: service.test.ts › "free-shipping threshold uses the discounted subtotal"
- A total never goes below zero.
  Enforced by: service.test.ts › "total never goes below zero"

## Hidden behavior
- Totals are snapshotted when an order is placed. Invoices read the snapshot,
  so a later price change never alters an invoice already issued.

## Recipes
### Change the order of application
1. Change combine() in service.ts
2. Update the matching rule and its test in service.test.ts
3. Run the checkpoint, then checkout's and invoice's checkpoints

## Mirrors
- none

## Consumers
<!-- generated: do not edit -->
- checkout, invoice
<!-- end generated -->
