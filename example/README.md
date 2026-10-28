# Wayfinding example

A small Express app laid out with Wayfinding Architecture, using TypeORM as
the ORM. It is the codebase the paper's examples describe: pricing with three
child domains, an `order-total` junction, consumers that reach other domains
only through their services, and HTTP routes kept apart from the decisions as
`routes/` adapters.

```
src/
├── app.ts                mounts each domain's routes
├── db.ts                 database connection; registers every domain's entities
├── seed.ts               development and test data; not a domain, so no domain imports it
├── customers/            customer profile, loyalty tier
├── pricing/              final price, discount cap
│   ├── customer-prices/  child domain: list and contract prices
│   ├── promotions/       child domain: promo codes
│   ├── sales/            child domain: product markdowns
│   └── routes/           adapter: HTTP endpoints for price quotes
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
service.test.ts
README.md         its map entry: Kind, ownership, rules, hidden behavior, recipes
routes/           an adapter: its HTTP endpoints, mounted in app.ts, with its own README.md
```

Every folder of code has one `README.md`, and its first line after the title
says what the folder is: `Kind: domain`, `child domain`, `junction`, `adapter`,
or `shared`. Owns, Interface and Checkpoint are required; Parent, Owns data,
Does not own, and every section are left out when they would say "none". Two
sections are generated: **Contains** lists the child domains and adapters
inside the folder, and **Consumers** lists who imports it.

A domain that stores nothing (tax, checkout, invoice) has no `model.ts`. A
domain with no endpoints of its own (the child domains, tax, shipping,
order-total) has no `routes/` adapter.

The code carries no comments. What a comment would say is in the folder's
`README.md`, as a rule anchored to a test or as hidden behavior.

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

- other domains are reached only through `service.ts`; `model.ts` and adapters stay private
- an adapter is called only by its own domain's `service.ts` (routes are mounted by `app.ts`), and an inbound adapter calls only that service
- child domains and `shared/` folders are visible only inside their parent; shared code imports nothing from other folders
- children never depend on their parent; no dependency cycles
- folder code imports nothing outside the folders except `db.ts`
- every table is defined by exactly one domain's `model.ts`, carries its prefix, and is listed under "Owns data"
- every top-level domain is on `MAP.md`, junctions are marked as junctions, and a top-level `shared/` folder is declared under "Shared"
- dead code: a file nothing imports, or an export nothing uses, fails unless its README.md declares the consumer (as pricing does for billing-sync)
- reuse: the same function (compared by tokens, not formatting) written in two folders fails, unless both declare it under Mirrors

Doc checks (Section 12):

- every folder of code has a `README.md` with a valid Kind line
- no comments in code, outside lint and compiler directives and license headers
- every rule has an *Enforced by* test, and that test exists
- no rule appears in two folders
- every file named in a Recipe exists
- the generated Contains and Consumers sections match the code; an empty one is removed
- a `README.md` longer than 60 lines is flagged for QA (a warning, not a failure)

Try breaking one: import `../pricing/promotions/service.ts` from
`src/invoice/service.ts`, or paste `layout()` from `src/invoice/service.ts` into
`src/checkout/service.ts`, then run `npm run check`.

## Try the worked example

Give your coding agent this ticket, from Section 12 of the paper:

> Loyalty members get an extra 5% off during holiday promotions. The total
> discount is still capped at $50. Show the loyalty discount as its own line
> on the invoice.

Watch whether it reads `MAP.md` and the relevant `README.md` files first,
notices the Hidden behavior lines that shape the plan (billing-sync, the
nightly promotions import, and the invoice parser), writes a route, and
finishes with `npm test` and `npm run check` passing. Then hand the route, the
diff, and the docs to a second agent in a fresh context as QA.

The details will differ from the paper's walkthrough (here, invoice reads
totals from the order-total snapshot), which is the point: the agent should
find the route from the map, not from the paper.
