# Wayfinding example

A small Express app laid out with Wayfinding Architecture, using TypeORM as
the ORM. It is the codebase the paper's examples describe: pricing with three
child domains, an `order-total` junction, and consumers that reach other
domains only through their services.

```
src/
├── app.ts                mounts each domain's routes
├── db.ts                 database connection; registers every domain's entities
├── seed.ts               development and test data
├── customers/            customer profile, loyalty tier
├── pricing/              final price, discount cap
│   ├── customer-prices/  child domain: list and contract prices
│   ├── promotions/       child domain: promo codes
│   └── sales/            child domain: product markdowns
├── tax/                  tax amount (no stored data)
├── shipping/             shipping charge
├── order-total/          junction: discount → shipping → tax
├── checkout/             consumes order-total
└── invoice/              consumes order-total
```

Every domain, including each child, has the same files:

```
model.ts          its entities (TypeORM); private to the domain
service.ts        its interface and business rules; the only file other domains import
routes.ts         its HTTP endpoints, mounted in app.ts
service.test.ts
DOMAIN.md
```

A domain that stores nothing (tax, checkout, invoice) has no `model.ts`. A
domain with no endpoints of its own (the child domains, tax, shipping,
order-total) has no `routes.ts`.

A model is a plain entity class:

```ts
@Entity('customers')
export class Customer {
  @PrimaryColumn('text') id: string
  @Column('text') name: string
  @Column('text') region: string
  @Column('integer') lifetimeSpendCents: number
}
```

The example builds its tables from the entities at startup (`synchronize: true`).
A production app would generate migrations from the same entities instead.

## Run it

Requires Node 22.18 or later. No database server is needed: the example uses
SQLite in memory. Change `type` in `src/db.ts` to use Postgres.

```bash
npm install
npm test                              # all tests
npm run checkpoint -- pricing         # one domain and its children
npm run check                         # mechanical guardrails and doc checks
npm start                             # http://localhost:3000
```

Then try:

```bash
curl -X POST localhost:3000/checkout -H 'content-type: application/json' \
  -d '{"customerId":"c-ben","region":"CA","items":[{"productId":"p-mug","quantity":2}]}'
curl localhost:3000/invoices/<orderId from the response>
```

Set `DB_FILE=dev.sqlite` to keep data between runs.

## What `npm run check` enforces

Structural guardrails (paper, Section 10):

- other domains are reached only through `service.ts`; `model.ts` and `routes.ts` stay private
- child domains are visible only inside their parent
- children never depend on their parent; no dependency cycles
- domain code imports nothing outside the domains except `db.ts`
- every table is defined by exactly one domain's `model.ts`, carries its prefix, and is listed under "Owns data"
- every top-level domain is on `MAP.md`, and junctions are marked as junctions

Doc checks (Section 12):

- every rule has an *Enforced by* test, and that test exists
- no rule appears in two domains
- every file named in a Recipe exists
- the generated Consumers sections match the code

Try breaking one: import `../pricing/promotions/service.ts` from
`src/invoice/service.ts`, then run `npm run check`.

## Try the worked example

Give your coding agent this ticket, from Section 12 of the paper:

> Loyalty members get an extra 5% off during holiday promotions. The total
> discount is still capped at $50. Show the loyalty discount as its own line
> on the invoice.

Watch whether it reads `MAP.md` and the relevant `DOMAIN.md` files first,
notices the Hidden behavior lines that shape the plan (billing-sync, the
nightly promotions import, and the invoice parser), writes a route, and
finishes with `npm test` and `npm run check` passing. Then hand the route, the
diff, and the docs to a second agent in a fresh context as QA.

The details will differ from the paper's walkthrough (here, invoice reads
totals from the order-total snapshot), which is the point: the agent should
find the route from the map, not from the paper.
