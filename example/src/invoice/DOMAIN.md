# invoice

Owns: invoice layout
Does not own: any amount on the invoice (see order-total)
Interface: renderInvoice()   (HTTP: GET /invoices/:orderId)
Checkpoint: npm run checkpoint -- invoice

## Rules
- Every invoice shows subtotal, discount, shipping, tax, and total, in that order.
  A zero discount is omitted.
  Enforced by: service.test.ts › "invoice lines appear in a fixed order"
- Amounts are shown in dollars with two decimals.
  Enforced by: service.test.ts › "amounts are shown in dollars with two decimals"
- An invoice shows the total snapshotted at checkout, never a recalculation.
  Enforced by: service.test.ts › "invoice reads the snapshot taken at checkout"

## Hidden behavior
- Invoices are also emailed as PDFs by the notifications service (separate
  repository), which parses the lines returned by renderInvoice().
  Adding a line is safe; renaming a label breaks its parser.

## Recipes
### Add an invoice line
1. Add the line in layout() in service.ts
2. Update the fixed-order test in service.test.ts
3. Update "Rules"

## Files
<!-- generated: files, do not edit -->
- `service.ts` (interface):
  - `type Invoice = {orderId: string; lines: string[]}`
  - `money(cents: number): string`
  - `layout(total: OrderTotal): string[]`
  - `renderInvoice(orderId: string): Promise<Invoice>`
- `routes.ts`: routes
- tests: `service.test.ts`
<!-- end generated -->
