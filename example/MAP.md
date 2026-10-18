# Map

| Domain | Owns | Interface |
| --- | --- | --- |
| customers | customer profile, loyalty tier | customerFor(), loyaltyTierFor() |
| pricing | final price, discounts | priceFor(), discountFor() |
| tax | tax amount | taxFor() |
| shipping | shipping charge | chargeFor() |
| order-total | junction: order total | orderTotal(), snapshotTotal(), totalForOrder() |
| checkout | checkout flow | startCheckout() |
| invoice | invoice layout | renderInvoice() |

Each domain's interface is its `service.ts`. HTTP routes are mounted in `src/app.ts`.

## Structural changes
- 2026-10-09  created order-total (junction): combines pricing, shipping, tax
- 2026-10-01  created pricing child domains: customer-prices, promotions, sales

## External sequences

### Nightly re-pricing
1. billing-sync (separate repository) lists open invoices
2. For each, it calls pricing.discountFor()          → pricing
3. It writes adjustments to the ledger (separate system)
