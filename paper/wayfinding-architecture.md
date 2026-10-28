# Wayfinding Architecture

*An Architecture for Discoverable, Bounded, and Safe Change*

Version 1.2 · October 28, 2026 · Rifaz Iqbal

## Abstract

**Software changes faster and more safely when every decision lives in one place you can find and every change has a clear scope.**

Wayfinding is an architectural approach built on that claim, for people and AI agents alike. It makes the ownership, impact, and scope of software changes explicit, discoverable, and enforceable.

Software becomes difficult to change when it is unclear where a requirement belongs, what else it affects, or how much of the system should change at once. In a city, the same problem is called wayfinding: knowing where you are, where you are going, and how to get there. Wayfinding Architecture applies that discipline to code.

It gives every change a **route** from requirement to checkpoint:

```
Requirement → Decision → Domain → Public Interface → Consumers → Segment → Change → Checkpoint
```

The foundational principle is simple:

> Every important decision is owned by exactly one domain.

Wayfinding borrows its central idea from how people navigate cities. They do not walk street by street; they head for landmarks they can find. In a codebase, the streets are files, imports, and keyword searches, and the landmarks are domains (Section 2).

The architecture builds on that principle in a fixed progression. Ownership is given an explicit boundary, the **domain**. Domains are made discoverable through a **map**. The structure is held in place by **guardrails**.

Large changes are split into **segments**: steps small enough to reason about, each able to be validated and reverted on its own, each ending with the system in a working state.

AI is not the foundation of Wayfinding, but AI-assisted development makes its benefits more visible. An agent can modify code quickly, yet it still needs to know where a decision belongs, what depends on it, and how much it should touch. Wayfinding makes that information part of the architecture instead of something an agent must reconstruct from an undifferentiated repository. Section 12 sets out a concrete operating procedure for agents.

## 1. The Problem

Most software architecture focuses on organizing code. Wayfinding focuses on a more practical question:

> When software needs to change, how do we know where the change belongs, what it can affect, and how much should change at once?

The purpose of the architecture is to make safe change predictable.

Consider a requirement:

> Customers may not receive more than $50 in discounts.

In a poorly structured system, implementing this may require searching through pricing code, checkout logic, order creation, database queries, API handlers, frontend calculations, tests, duplicated business rules, configuration, and integrations.

The difficulty is not necessarily that the system lacks abstractions. The difficulty is that ownership and impact are unclear, so a developer or AI agent has to reconstruct the architecture from the implementation. They are lost.

That creates three kinds of friction, each tied to one question:

- **Location friction** — *Where does this change belong?*
- **Impact friction** — *What can it affect?*
- **Scope friction** — *How much should change at once?*

Every part of Wayfinding exists to answer one or more of these questions. The rest of this paper returns to them repeatedly.

## 2. Why "Wayfinding"

Wayfinding is the discipline of helping people find their way through complex spaces. The term comes from urban planning: Kevin Lynch introduced it in *The Image of the City* (1960), where he studied how people orient themselves in a city.

A codebase is a complex space. The three questions of this paper are its wayfinding questions: where am I going, what will I pass through, and how far should I travel at once.

### Navigating by landmarks

In a city, people rarely navigate street by street. They head for landmarks: the cathedral, then the market square beside it. A landmark is a named, fixed place everyone can find, and directions are given relative to it.

In a codebase, the streets are the code itself: files, folders, imports, and call chains. Navigating street by street is what happens when there is no architecture to guide you. You search for a keyword, open a file, follow an import, read, search again, and hope the trail leads to the right place.

In Wayfinding, the landmarks are **domains**. To change how promotions work, you do not search for "promotion" and sift through every match. You head for the pricing domain, and its `README.md` points you to promotions, the child domain that holds the promotion rules. From there you look outward to the domains that use pricing. The change becomes a short series of known stops instead of a walk down every street.

A landmark only works if there is one of it. Two town squares with the same name do not help anyone find their way; they get people lost. Code is the same: when two places decide the discount, neither can be trusted, and every change to that rule becomes guesswork. That is why each decision belongs to exactly one domain.

The analogy maps onto the paper's terms one to one:

| In a city | In code | Term in this paper |
| --- | --- | --- |
| Streets | Files, folders, imports, keyword search | None: this is what you navigate without Wayfinding |
| Landmarks | Places that own decisions | Domain |
| Crossroads | Places where decisions from several domains combine | Junction |
| Your route | The steps a change takes | Route |

This is the only section that uses the city as vocabulary. From here on, the paper says *domain*, *junction*, and *route*.

### Terms

Each term means exactly one thing, and each concept has exactly one term. *Owns* is only ever a verb: a domain owns a decision.

| Term | Meaning | Not to be confused with |
| --- | --- | --- |
| Requirement | What the business asks for | The decision that changes to meet it |
| Decision | A rule that determines behavior, such as how a discount is calculated | A value; the same value can appear in many places |
| Domain | The one place a set of decisions, and the data they need, lives | A DDD domain or bounded context, which is drawn around a model rather than around decisions |
| Child domain | A domain inside another domain, reached only through its parent | A folder; a child has its own interface, data, and docs |
| Adapter | Code that connects a domain to something outside it: HTTP, a database, an external system, or legacy code | A domain; an adapter makes no business decisions |
| Shared | Helpers that make no decision and serve several parts of one domain, kept in its shared/ subfolder | A top-level library; shared code lives inside a domain unless no domain can own it |
| Junction | A domain whose rules combine decisions from other top-level domains | A parent combining its own children, which stays inside one domain |
| Public interface | The only way into a domain from outside | Internal functions, which no other domain may call |
| Consumer | Code that depends on a domain's public interface | The domain that owns the decision |
| Route | The steps a change takes, from requirement to checkpoint | A runtime call path |
| Segment | One step of a route that can be validated and reverted on its own | A ticket or pull request, which may hold one segment or several |
| Checkpoint | The tests and checks a segment must pass | The final release check; every segment has its own |
| Map | `MAP.md` plus each folder's `README.md` | Full documentation; the map points to code rather than explaining it |
| Discovered / declared | Map information generated from code / written in the docs | — |
| Guardrails | Automated checks that keep the structure from drifting | Code review |
| Mirror | A deliberate, declared copy of a decision, such as a client-side price preview | Duplicate authority, which is an undeclared copy |

## 3. Each Decision Belongs to One Domain

The foundation of Wayfinding is decision ownership:

> Every important decision is owned by exactly one domain.

This answers the first question, *where does this change belong?* A change belongs in the domain that owns the decision it alters.

### What counts as a decision

A decision is anything that determines behavior according to a meaningful rule. Most are business decisions:

- how a discount is calculated
- whether an account can perform an operation
- how a shipping charge is determined
- whether an order can be cancelled

Technical decisions count too, when they shape behavior that others rely on:

- how failed payment calls are retried
- how long a cached price stays valid
- which fields an audit log records

Including technical decisions keeps cross-cutting concerns such as retries, caching, and logging inside the model instead of leaving them without a home.

### Representation versus authority

The same value may legitimately appear in many places. A calculated discount may be returned by an API, displayed in a frontend, stored on an order, and printed on a receipt. Those representations are not a problem.

Architectural drift begins when several places independently decide what the discount should be.

> Duplicate representation is acceptable. Duplicate authority is not.

### Mirrors

Sometimes a decision must be computed in a second place on purpose: client-side validation for responsiveness, a price preview, an offline client. These are **mirrors**. A mirror is acceptable when three conditions hold:

1. It is declared on the map as a mirror of a named domain.
2. When the mirror and the domain disagree, the domain's answer wins.
3. A checkpoint verifies the mirror against the domain.

An undeclared mirror is simply duplicate authority.

### Domains, not teams

Teams own domains — often recorded through code-owner files — but that is an organizational mapping layered on top. A decision belongs to exactly one domain even when several teams contribute to it.

## 4. Domains

Ownership needs a place to live. In Wayfinding that place is the **domain**: an area of the system with a clear identity, defined by what it owns rather than by how its files are arranged.

> A domain is the smallest architectural boundary that owns a coherent set of decisions, and any data those decisions need, and exposes them through an explicit public interface.

*Domain* here means an ownership boundary. It often lines up with a domain or bounded context in domain-driven design, but the test is different: a Wayfinding domain is drawn around who owns a decision, not around a shared model or language.

### What makes a domain coherent

Decisions belong in the same domain when they **change for the same reason, at the same time**. Discount rules and price calculation usually change together; payment retries and receipt layout do not. This is the long-standing criterion behind information hiding and the single-responsibility principle, applied to decisions.

If a domain holds decisions that change for unrelated reasons, its boundary stops predicting where a change will land, and the ownership model loses its value.

### Four questions every domain answers

1. **What decisions does this domain own?**
2. **What does it expose?**
3. **Who consumes it?**
4. **What does it explicitly not own?**

The fourth matters as much as the first. A domain whose non-ownership is undefined tends to absorb neighboring decisions until its boundary means nothing.

### Data belongs to domains

A domain owns its decisions and any data those decisions need. **Only a domain writes its own data.** Other domains reach it through its interface, or refer to it by ID.

Not every domain stores data. A tax domain may only calculate from rates it fetches. It is an ordinary domain rather than a junction, because its rules are about its own concern, not about combining other domains.

Every domain has the same files, whatever its size. The examples in this paper assume an Express app written in TypeScript, with TypeORM as the ORM:

```
src/pricing/
├── model.ts            tables: pricing_settings
├── service.ts          interface and business rules: priceFor(), discountFor()
├── routes/             adapter: HTTP endpoints that call the service
├── service.test.ts
└── README.md
```

Only `service.ts` is public: other domains import it and nothing else. The model is private, so only the domain's own service reads or writes its tables. A domain with no stored data has no `model.ts`, and a domain with no endpoints has no `routes/` adapter.

### One writer per table

Every table has exactly one writing domain. When several decisions touch the same entity, split its data by the decision that changes it, not by the entity. The entity keeps one ID; its data lives with the domains that write it:

```
orders           (orders domain)          id, customer_id, status, placed_at
order_totals     (order-total junction)   order_id, subtotal, discount, tax, total
order_payments   (payments domain)        order_id, paid_at, method
```

This keeps the coherence test intact. Tables follow the decisions that change them, so no domain grows to own everything about an order.

### Reading across domains

By default, other domains read through the interface and refer to data by ID, such as `orders.discount_code`. When a join or a report needs direct access, the owning domain publishes a **read view**, for example `shipping_rates_v`, that other domains may query. Raw tables stay private: the domain controls what is exposed and can change its storage without breaking readers.

Read copies for reporting or search are representations; the owning domain stays authoritative. A table prefix such as `pricing_` makes ownership visible and checkable.

### Child domains

A domain can contain other domains. When part of a domain gets its own rules and its own data, and changes for its own reasons, it becomes a **child domain**: a folder inside the parent with the same parts as any domain. Nesting lets a domain grow without becoming a tangle, and without pushing every new concept to the top level.

In this example, what a customer pays depends on three things: who the customer is, any seasonal promotion, and any sale on the product. Each is a child of pricing. Pricing and one child, promotions, are expanded to show that they have the same shape:

```
src/pricing/
├── model.ts                tables: pricing_settings
├── service.ts              priceFor(), discountFor(); combines the children
├── routes/                 adapter: HTTP endpoints for prices
├── service.test.ts
├── README.md
├── shared/                 helpers used by the child domains
├── customer-prices/        child domain: each customer's base price
├── promotions/             child domain: seasonal promotions and promo codes
│   ├── model.ts            tables: pricing_promotions
│   ├── service.ts          promotionFor(); promotion rules
│   ├── service.test.ts
│   └── README.md
└── sales/                  child domain: time-limited markdowns on products
```

A child domain is simply a domain inside a domain. The one difference is reach: pricing's service is used across the system, while promotions' service is used only inside pricing. That is also why promotions has no `routes/` adapter: nothing outside pricing reaches it directly. Pricing's own data is small: `pricing_settings` holds the discount cap, so finance can change it without a code change.

#### When to create a child domain

Split part of a domain into a child when most of these hold:

- it has rules that change for their own reasons (promotions change with marketing campaigns; customer prices change with contracts)
- it owns data that no other part of the parent writes
- it can be tested on its own
- it can be described in one sentence without mentioning its siblings

Do not split just because a file got long. A child that shares data or rules with its siblings belongs back in the parent. Keep nesting to one level by default: a child that needs children of its own is usually ready to become a top-level domain.

#### Rules for nesting

- **Outside the parent, only the parent's interface is visible.** Checkout calls `pricing.priceFor()`, never `pricing/promotions` directly.
- **Children never depend on their parent.** Dependencies run downward: pricing calls promotions, never the reverse.
- **Siblings reach each other only through their interfaces, and never in a cycle.** If siblings need each other often, their combination belongs in the parent.
- **Each table belongs to the child that writes it.** `pricing_promotions` belongs to promotions, not to pricing as a whole.

#### The parent combines its children

When a parent combines its children's decisions, it owns that combination rule. Here, `priceFor()` starts from the customer's price, applies the better of any active promotion or sale, and caps the total discount at $50. That rule lives in pricing's own `service.ts`.

This is the junction idea inside one domain. The difference is scope: a parent combines its own children, which nothing outside can see, while a junction (Section 5) combines independent top-level domains that others also use.

#### Data inside a child

The child's table lives in its own `model.ts`, as an entity:

```ts
@Entity('pricing_promotions')
export class Promotion {
  @PrimaryColumn('text') id: string
  @Column('text', { unique: true }) code: string
  @Column('integer') percentOff: number
  @Column('datetime') activeFrom: Date
  @Column('datetime', { nullable: true }) activeTo: Date | null
}
```

Schema and migrations come from the entities, so each domain's tables are defined in its own folder.

What the service returns is what the parent sees, and it is deliberately different from the entity:

```ts
export type AppliedPromotion = {
  code: string
  amountCents: number
}

export async function promotionFor(codes: string[], subtotal: number, at: Date): Promise<AppliedPromotion | null>
```

Pricing receives the *result* of the decision, `amountCents`, never the raw row. Holding the row, pricing could recompute the promotion itself, which is duplicate authority again.

#### Changes inside a child

Nesting shrinks the blast radius of a change. A change that stays inside a child and leaves its interface alone has exactly one consumer: the parent. The route names the child directly:

```
Requirement:   Promotions apply only to full-price items
Decision:      which items a promotion applies to
Domain:        pricing/promotions
Consumers:     pricing (nothing outside pricing is affected)
Segment:       Change promotion eligibility in promotions/service.ts
Checkpoint:    promotions tests, pricing tests
```

Consumers outside the parent, such as checkout or invoice, enter the route only when the parent's interface changes.

#### Promoting and merging

Boundaries move as the system grows. When something outside the parent needs a child directly, promote the child to a top-level domain, and leave the parent calling it through its interface. When a child stops changing on its own, or always changes together with its parent, merge it back. Either move is a structural change: its own segment, logged in `MAP.md`.

#### Child domains on the map

`MAP.md` lists only top-level domains, and each parent's `README.md` lists its children and adapters in a generated Contains section. The map stays short, and nesting adds one more level of progressive disclosure. A child's `README.md` uses exactly the same sections as its parent's (Section 12 shows the one for pricing). Here is the one for promotions:

```markdown
# promotions

Kind: child domain
Parent: pricing
Owns: seasonal promotions and promo codes; which promotion applies to an order
Owns data: pricing_promotions
Does not own: customer prices, sales, the discount cap (see pricing)
Interface: promotionFor(codes, subtotal, at)   (used only inside pricing)
Checkpoint: npm run checkpoint -- pricing/promotions

## Rules
- A promotion applies only between its active_from and active_to dates.
  Enforced by: service.test.ts › "expired promotion does not apply"
- One promo code per order.
  Enforced by: service.test.ts › "second promo code is rejected"

## Hidden behavior
- Promo codes are imported nightly from the marketing tool (separate system).
  Direct edits to pricing_promotions are overwritten by the import.

## Recipes
### Add a new kind of promotion
1. Add the rule in service.ts, behind promotionFor()
2. Add a test named after the rule
3. Add the rule to "Rules" with its test
4. Run the checkpoint

## Mirrors
- none

## Contains
<!-- generated: do not edit -->
- none
<!-- end generated -->

## Consumers
<!-- generated: do not edit -->
- pricing
<!-- end generated -->
```

The discount cap is not here. It applies across promotions and sales, so it belongs to the parent, which combines them.

### Decisions and adapters

Code in a domain is one of two kinds. **Decisions** are the rules the domain owns. **Adapters** connect the domain to something outside it: HTTP, a database, a queue, an external system, or legacy code. An adapter makes no business decisions. It may hold technical ones about its outside system, such as how failed calls are retried.

Sorting code this way helps draw domains. Set the adapters aside, and what remains is decisions, grouped by the coherence test. Each adapter then belongs to the domain it serves.

An adapter gets its own folder and `README.md`, like a child domain. The database adapter, `model.ts`, stays a file: it only maps the tables the domain's `README.md` already lists under *Owns data*.

```
src/payments/
├── service.ts
├── service.test.ts
├── model.ts
├── README.md        Kind: domain
├── routes/
│   ├── routes.ts
│   ├── routes.test.ts
│   └── README.md    Kind: adapter
└── stripe/
    ├── client.ts
    ├── client.test.ts
    └── README.md    Kind: adapter
```

Every `README.md` uses the same template and opens with a *Kind* line: domain, child domain, junction, adapter, or shared. One file name and one shape serve every folder. For an adapter, *Rules* holds technical rules only:

```markdown
# stripe

Kind: adapter
Parent: payments
Owns: calls to Stripe for charges and refunds
Does not own: whether a charge or refund happens (see payments)
Interface: charge(), refund()   (used only inside payments)
Checkpoint: npm test -- payments/stripe

## Rules
- Failed calls retry 3 times with backoff.
  Enforced by: client.test.ts › "retries a failed charge 3 times"
- Every charge carries an idempotency key.
  Enforced by: client.test.ts › "charge sends an idempotency key"

## Hidden behavior
- Test-mode and live-mode data are separate; test keys never see live charges.

## Contains
<!-- generated: do not edit -->
- none
<!-- end generated -->

## Consumers
<!-- generated: do not edit -->
- payments
<!-- end generated -->
```

Three rules keep adapters in place:

- An adapter belongs to exactly one domain. Only that domain's service calls it, and an inbound adapter, such as `routes/`, calls only that service.
- Each external system is reached through one domain's adapter, so every rule about that system has one owner. `MAP.md` names that domain under *External systems*.
- A business rule found in an adapter is misplaced. It moves to the domain's service.

### Shape is illustrative

The exact directory structure is not part of the architecture. This paper uses an Express app with TypeORM and one `service.ts` per domain as the boundary; a package manifest's exports, language-level visibility, or a service contract serves the same purpose. What matters is that the domain has a clear responsibility, an explicit boundary, data written only from inside it, and consumers who interact only through that boundary.

## 5. Junctions

Some decisions are built from other decisions. A **junction** is the point where decisions from several domains meet and a further decision has to be made about how they combine. That combining decision must belong to one domain, like any other.

A junction is a kind of domain: its main rules are about combining other domains' decisions and data, rather than about a concern of its own. Like any domain it may hold data — the state or results of the combination — but it never writes another domain's data.

### The problem

A customer's order total draws on three decisions, each owned by its own domain:

```
pricing    → discount
tax        → tax amount
shipping   → shipping charge
```

Combining them requires answers none of those domains own:

- Is the discount applied before or after tax?
- Does a free-shipping threshold use the price before or after the discount?
- If a discount exceeds the subtotal, can the total go below zero?

When nobody owns those answers, every consumer that needs an order total answers them itself:

```
checkout    → discount, then tax, then shipping
invoice     → tax, then discount, then shipping
order API   → discount, then shipping, then tax
```

Each consumer calls the correct domains through their public interfaces. Every input is right, and the totals still disagree.

Nothing looks duplicated, because no one re-implemented the discount rule. What was duplicated is the rule for combining them. This is duplicate authority hiding at the seam, and because each piece looks correct on its own, it is the hardest kind to find.

> Where decisions meet, the way they combine is itself a decision, and it belongs to one domain.

### The junction

The fix is to give the combination rule a home: a domain whose only responsibility is the junction.

```
junction: order total
domain: order-total

inputs:
    pricing.discountFor()      (domain: pricing)
    tax.taxFor()               (domain: tax)
    shipping.chargeFor()       (domain: shipping)

owns:
    order of application: discount → shipping → tax
    free-shipping threshold uses the discounted subtotal
    a total never goes below zero

does not own:
    how discount, tax, or shipping is calculated

public interface:
    orderTotal()

consumers:
    checkout, invoice, order API
```

Consumers now ask the junction for the total instead of composing it themselves:

```
Before:
    checkout   ─┐
    invoice    ─┼─→  pricing, tax, shipping            each consumer combines them its own way
    order API  ─┘

After:
    checkout   ─┐
    invoice    ─┼─→  order-total  ─→  pricing, tax, shipping      combined once, in one place
    order API  ─┘
```

### Where a junction lives

A junction is a domain in its own right. It sits beside the domains it combines, not inside any one of them:

```
src/
├── app.ts                      mounts each domain's routes
├── pricing/                    domain: discount, price
│   ├── model.ts
│   ├── service.ts              discountFor(), priceFor()
│   ├── routes/                 adapter: HTTP
│   ├── customer-prices/        child domain
│   ├── promotions/             child domain
│   ├── sales/                  child domain
│   └── README.md
├── tax/                        domain: tax amount (no stored data, so no model.ts)
│   ├── service.ts              taxFor()
│   └── README.md
├── shipping/                   domain: shipping charge
│   ├── model.ts                tables: shipping_rates
│   ├── service.ts              chargeFor()
│   └── README.md
├── order-total/                junction: order total
│   ├── model.ts                tables: order_total_snapshots
│   ├── service.ts              orderTotal(): the combination rule, nothing else
│   ├── service.test.ts
│   └── README.md               declares: junction, inputs, rule
├── checkout/                   consumes order-total
├── invoice/                    consumes order-total
├── order-api/                  consumes order-total
└── MAP.md
```

Putting the junction inside `pricing` would make pricing own the order of tax and shipping, which it does not. Putting it in `checkout` would make it a private rule that invoice and the order API cannot reach, which is how the inconsistency started.

Dependencies run in one direction:

```
checkout, invoice, order-api
            ↓
       order-total          (junction)
            ↓
  pricing, tax, shipping    (inputs)
```

Two guardrails keep it that way:

- the inputs may not depend on `order-total`
- consumers may not call `pricing`, `tax`, and `shipping` together to build their own total; they ask `order-total`

### How a junction changes

The route treats a junction like any other domain. Two changes show the difference.

A change to the combination rule touches only the junction:

```
Requirement:   Apply discounts after tax
Decision:      order of application
Domain:        order-total (junction)
Segment:       Change application order in orderTotal()
Consumers:     checkout, invoice, order API — no code changes
```

A change to an input lists the junction among its consumers:

```
Requirement:   Cap discounts at $50
Decision:      discount calculation
Domain:        pricing
Segment:       Change maximum discount behavior
Consumers:     order-total (junction) — checkpoint only, no code change
```

### What a junction owns

A junction usually decides one of four things: the order in which decisions apply, which decision wins when they conflict, how their results merge, or which step comes next in a sequence that crosses domains.

- **It owns only the combination rule.** It reaches its inputs through their public interfaces and never re-implements them.
- **Its rule is written down explicitly,** as an order, a precedence, or a limit, not implied by the sequence of statements in code.
- **It appears on the map as a junction,** with its inputs listed.
- **It owns a rule, not just a view.** A service that only gathers data from several places for display, such as a dashboard or a report, makes no rule about combining it. It is a consumer or a read model, not a junction.
- **It may hold its own data, never another domain's.** A junction can store the state or results of the combination, such as a refund's status or a snapshot of an order total. It reaches other domains' data only through their public interfaces.

The failure mode to watch for is a junction that starts absorbing the logic of its inputs. At that point it holds duplicate authority over them.

### Junctions that own sequences

A junction can also own a sequence of steps across domains, and keep track of where it is. A refund that waits one to two days for finance approval has state: *pending approval*, *approved*, *reversed*, *recorded*. That state belongs to the refund junction, which combines `payments` and `ledger`:

```
junction: refund
domain: refund

owns data:
    refunds (id, order_id, amount, status, requested_at, approved_at)

owns rules:
    sequence: approve if needed → reverse charge → record reversal
    refunds over $500 require finance approval
    a refund is recorded only after the charge is reversed

inputs:
    payments.reverseCharge()
    ledger.recordReversal()
    approvals.request()          (adapter to the ERP)

does not own:
    how a charge is reversed, how a reversal is recorded

hidden behavior:
    finance approval happens manually in the ERP, usually in 1–2 days
```

> If a sequence can be owned in code, own it in a junction. Document only what no code you control can own, next to where it touches your system.

A junction that owns a sequence owns the order of steps and the conditions that gate them, never the logic inside the steps. Sequence junctions are the most likely to grow into god objects.

### Consistency across domains

When a junction combines writes in several domains, keeping them consistent is the junction's responsibility. Each domain still performs its own writes through its interface; the junction decides how they hold together:

- **One deployable, shared database:** the junction runs the steps inside a single transaction, calling each domain's interface within it.
- **Separate stores or services:** the junction records its progress and uses compensating steps, so a failure part-way through is either retried or undone. The refund junction's `status` column records exactly where a refund stopped.

Either way, one domain is responsible for the whole sequence, instead of each domain hoping the others succeed.

## 6. The Route

The route is the backbone of Wayfinding: a predictable path from a requirement to a validated change. Every other concept in this paper is a step on it.

The route moves domain to domain: to the domain that owns the decision, down to its child domain if there is one, then out to the domains that consume it, confirming each step before moving on.

```
Requirement
    ↓
Decision
    ↓
Domain
    ↓
Public Interface
    ↓
Consumers
    ↓
Segment
    ↓
Change
    ↓
Checkpoint
```

| Step | Question it answers |
| --- | --- |
| Requirement | What behavior does the requirement ask for? |
| Decision | What decision or rule is actually changing? |
| Domain | Which domain owns that decision? |
| Public Interface | How do other parts of the system reach it? |
| Consumers | What known parts of the system depend on it? |
| Segment | What bounded step of the change comes next? |
| Change | What implementation must be modified? |
| Checkpoint | What tests and checks show the segment is correct? |

The steps map onto the three questions:

- **Where does this change belong?** Decision and domain.
- **What can it affect?** Public interface and consumers.
- **How much should change at once?** The segment.

### Changes that are not decisions

Not every change alters a decision. Refactors, performance work, dependency upgrades, and internal restructuring may change no behavior at all.

These changes take a shorter route. They start at the domain rather than at a decision, because the question is not *whose rule is this?* but *which domain am I working in?* The rest of the route still applies:

```
Domain
    ↓
Public Interface   (must stay unchanged, or the change is no longer behavior-neutral)
    ↓
Consumers
    ↓
Segment
    ↓
Change
    ↓
Checkpoint         (behavior is unchanged)
```

A change that spans every domain, such as a framework upgrade, is planned as a sequence of segments, one domain at a time where possible.

## 7. Segments

Knowing where a change belongs is only half of safe change. The other half is the third question: *how much should change at once?* Wayfinding answers it by splitting a route into **segments**.

> A segment is a change that targets one coherent decision or capability through one domain's boundary, and that can be validated and reverted on its own.

The discount requirement becomes a single segment:

```
Requirement:
    Cap discounts at $50

Decision:
    discount calculation

Domain:
    pricing

Public interface:
    pricing.discountFor()

Known consumers:
    cart, checkout, invoice

Segment:
    Change maximum discount behavior

Checkpoint:
    pricing tests
    affected consumer tests
    guardrail checks
```

The requirement and the segment are deliberately separate. The requirement states what the business wants. The segment states what will actually change, and where.

Within a single deployable, a segment that changes a public interface may also make the mechanical updates its callers need — a rename, or a signature change the compiler checks. They are validated and reverted together. What a segment may not do is change another domain's decisions.

### When is a segment bounded?

Not by a count of files or lines. A segment is bounded when all three hold:

1. **It can be described in advance.** Its domain, known consumers, and checkpoint can be named before work begins.
2. **It can be validated on its own.** Its checkpoint passes without waiting for a later segment.
3. **It can be reverted on its own.** Undoing it does not require undoing anything else.

The first condition alone is not enough: an enormous change can still pass through a single domain. The second and third keep segments small in practice.

### Every segment ends at a safe stopping point

A route with several segments is only safe if the system works between them. Within one deployable, callers can move in the same segment as an interface change. When consumers are deployed separately, are external, or depend on persisted data, they cannot: consumers on the old interface must keep working until their own segment arrives.

For those consumers, the standard technique is **expand, then contract**: add the new interface alongside the old, move consumers one segment at a time, and remove the old interface in a final segment.

```
Requirement:
    Introduce customer discount limits

Segment 1 (pricing):    Add the discount cap behind the existing interface
Segment 2 (pricing):    Add the new interface field alongside the old one
Segment 3 (checkout):   Move checkout to the new interface
Segment 4 (invoice):    Move invoice presentation to the new interface
Segment 5 (pricing):    Remove the old interface field
```

After every segment, all checkpoints pass and the system can ship.

### Schema changes

Because schemas live inside domains, a segment often changes stored data, and migrations cannot always be undone. Schema changes are therefore forward-only and follow expand, then contract at the column level:

```
Segment 1: add the new column            (old code still works)
Segment 2: write to both columns
Segment 3: switch reads to the new column
Segment 4: drop the old column
```

For a migration, *can be reverted on its own* means the code can be reverted without reverting the schema. Every expand step is backward-compatible, so rolling back code never strands data.

### Where a segment is declared

For a segment to be checked, it is written down before work begins, using the same fields as the example above, somewhere a machine can read: a field in a pull request, a ticket, or a small file in the change. Guardrails then compare the actual change against it (Section 10).

### Segments and blast radius

If a segment fails, the number of possible causes is small, because its scope was known before implementation began. Diagnosis becomes a search over one segment rather than over everything the change happened to touch.

## 8. The Map

An architecture only helps if its structure can be found. Wayfinding makes the route discoverable through a lightweight **map**, such as a `MAP.md` file at the root of the repository.

The map is a navigation layer, not a documentation system: a list of domains, showing which decisions each one owns and where its interface is. Like a "you are here" sign, its job is to show the next step, not to explain the whole city.

### Discover, declare, check

> Discover what the code can show. Declare what only humans know. Check that the two agree.

- **Discovered** — generated from code: domains, exports, imports, direct consumers, public interfaces, test locations.
- **Declared** — stated in the docs, by people or agents: what a domain owns and does not own, junctions, mirrors, external relationships, intended boundaries, and business terminology.
- **Check** — guardrails verify that the two still agree.

The map has two levels: `MAP.md`, a short index of domains and junctions, and a `README.md` in each domain, child domain, and adapter holding its full entry. Section 12 shows both. Generated sections are marked so nobody edits them by hand.

## 9. What the Map Cannot See

A discovered import graph is useful evidence, but it is not the complete impact graph. This limits how confidently Wayfinding can answer the second question, *what can it affect?*

Software also communicates through mechanisms that imports cannot reveal: HTTP APIs, events, queues, generated clients, database schemas, shared contracts, configuration, and external integrations.

Anything neither discovered nor declared is not on the map: a relationship nobody has recorded yet.

> A discovered dependency graph is evidence of known relationships, not a complete oracle of runtime behavior.

This applies directly to blast radius. The consumer list in a segment is the *known* consumers, not a guarantee that no others exist. A change that looks local in source code may reach much further through an API or event contract.

Wayfinding does not claim to see everything. It makes the recorded relationships explicit and makes the limits of the map visible, so a gap is a known gap rather than a hidden one. When a failure reveals an unrecorded relationship, the fix includes adding it to the map.

## 10. Guardrails

Ownership says where a decision belongs. Domains make it concrete. The map makes it findable. Guardrails keep all three true over time. Without them, the architecture becomes documentation that eventually diverges from the code.

Not every guardrail can be fully automated, and the paper is explicit about which are which.

### Structural guardrails (mechanical)

These can be checked by tooling with no human judgment:

- forbidden dependencies between domains
- unexpected public exports
- dependency cycles between domains
- a stale map, where discovered and declared information disagree
- segment scope, where a change touches domains its declared segment did not name
- undeclared crossings, where a change adds a dependency across a boundary without a declared exception
- reads of another domain's raw tables instead of its published read views
- writes to a domain's tables from code outside that domain
- imports of anything in another domain other than its `service.ts`
- imports of a child domain from outside its parent
- a child domain that depends on its parent, or sibling children that depend on each other in a cycle
- new writers to a legacy table beyond its declared exceptions (Section 13)
- dead code: exports, files, functions, or folders that nothing uses and no declared consumer needs
- an adapter called by anything other than its own domain's service, or an inbound adapter that calls anything else
- an external system's client library imported from more than one domain
- a top-level shared/ folder not declared in MAP.md, or shared code that imports from its siblings

### Semantic guardrails (assisted)

These require understanding what code *means*. Tooling flags candidates; the independent QA agent decides:

- **duplicate authority**: logic outside the owning domain that appears to re-implement its decision
- **undeclared mirrors**: a second implementation of a decision that is not declared as a mirror
- **misplaced decisions**: a rule implemented in a consumer instead of the domain that owns it
- **near-copies**: new code that repeats an existing interface or shared helper instead of calling it

The goal is not to make every rule absolute. The goal is to make important structural decisions visible and verifiable, so that exceptions are deliberate rather than accidental.

> The dependency graph shows what the system does reach. Guardrails state what it is allowed to reach.

## 11. The Model at a Glance

Each element exists because of the change problem. None is an independent rule:

| Element | What it does | Question it serves |
| --- | --- | --- |
| Domain | Owns decisions and the data they need; makes ownership concrete | Where does this change belong? |
| Junction | Owns the rules that combine other domains' decisions and data | Where does this change belong? |
| Public interface | Carries impact from a domain to its consumers | What can it affect? |
| Map (discovered and declared) | Shows known consumers and where its knowledge ends | What can it affect? |
| Segment | Limits how much changes at once | How much should change at once? |
| Checkpoint | Confirms each segment before the next begins | How much should change at once? |
| Guardrails | Keep the structure from silently drifting | All three |

## 12. An Operating Procedure for AI Agents

The architecture itself is technology-neutral. This section is its operating procedure for AI agents: how to run Wayfinding when agents make most of the changes. Agents are where it pays off fastest. They are also where its structure becomes most concrete: a small set of markdown files that the agent reads first and updates last.

Each of the three questions has a characteristic agent failure:

- **Without explicit ownership,** an agent finds several plausible implementations of a rule and changes the wrong one, or writes a new one somewhere else.
- **Without known consumers,** it changes a consumer instead of the domain that owns the decision.
- **Without segments,** it modifies far more of the repository than the requirement needed.

> The architecture should make it possible to define exactly what the agent is being asked to change.

### The files

The map from Section 8 becomes a handful of files, one for each level of progressive disclosure:

| File | Level | Contains |
| --- | --- | --- |
| Agent instructions | Repository | How to walk the route, and the rules the agent must follow |
| `MAP.md` | Map | One line per top-level domain and junction: what it owns and its interface |
| `README.md` | Folder | Rules, hidden behavior, recipes, and generated sections |

The goal is speed. An agent that starts from explicit instructions spends its time changing code, not reconstructing how the system works. Writing and maintaining these files costs the agent seconds; the payoff is fewer wrong changes and faster review. Wayfinding sets no context budgets. It keeps code reads small at the source instead: the domain, consumers, and rules are known before reading begins, and the code holds nothing the agent does not need (see Minimizing code reads).

**Agent instructions** live in whatever file the agent tool loads automatically, such as `AGENTS.md`. They teach the route:

```markdown
# How to change this codebase

Before writing code:
1. Read MAP.md and find the domain that owns the decision you are changing.
2. Read that domain's README.md: rules, hidden behavior, recipes.
3. Write down the route: decision, domain, consumers, segments.

While changing code:
- Change a decision only in its owning domain.
- Reach other domains only through their public interface.
- Never re-implement another domain's decision; call it.
- Before writing new code, look for an interface or shared helper
  that already does the job, and reuse it.
- Put a shared helper in the shared/ folder of the nearest parent
  of its callers. Use the top level only if no domain can own it,
  and declare it in MAP.md.
- Write only the code the decision needs, and no comments;
  behavior goes in README.md.
- If no domain owns the decision and only one place uses it, record it under
  that domain's "Owns". Create a new domain only when a second place needs it;
  do it in its own segment and log it in MAP.md.
- If README.md and the code disagree, a test this segment did not modify decides.
  Fix whichever side is wrong and note the correction.

Before finishing:
- Update Rules, Hidden behavior, and Recipes in every README.md you touched.
- Never edit generated sections; regenerate them.
- Keep each README.md small: one line per rule, and delete what is no longer true.
- Delete code, tests, and folders this segment left unused,
  unless a declared consumer still needs them.
- Put any change to "Owns" or "Does not own" in its own segment,
  so QA sees it separately.
```

**`MAP.md`** is the index. It stays short enough to keep in context for every task:

```markdown
| Domain       | Owns                     | Interface                  |
|--------------|--------------------------|----------------------------|
| pricing      | final price, discounts   | priceFor(), discountFor()  |
| tax          | tax amount               | taxFor()                   |
| shipping     | shipping charge          | chargeFor()                |
| order-total  | junction: order total    | orderTotal()               |
| checkout     | checkout flow            | startCheckout()            |
| refund       | junction: refunds        | requestRefund()            |

## Structural changes
- 2026-10-09  created order-total (junction): combines pricing, tax, shipping

## Legacy tables
- customers: written by legacy-admin, crm-sync (declared exceptions)

## External systems
- Stripe: payments/stripe
```

**`README.md`** holds the folder's full map entry, plus what an agent needs to work there without reverse-engineering the code:

```markdown
# pricing

Kind: domain
Parent: none (top-level domain)
Owns: final price (customer price, then the better of promotion or sale), discount cap
Owns data: pricing_settings
Does not own: tax, shipping, order total (see order-total)
Interface: priceFor(), discountFor()
Checkpoint: npm test -- pricing

## Rules
- Discounts are capped at $50 per order.
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
2. Combine it in pricing's service.ts
3. Add a test named after the new rule
4. Run the checkpoint

## Mirrors
- web/discount-preview (pricing wins on disagreement)

## Contains
<!-- generated: do not edit -->
- customer-prices, promotions, sales (child domains)
- routes (adapter)
<!-- end generated -->

## Consumers
<!-- generated: do not edit -->
- cart, checkout, invoice, order-total
<!-- end generated -->
```

Some agent tools also load instruction files from a subfolder when they work inside it. Where yours does, that file can simply point to the folder's `README.md`, so the agent reads the right rules without being told to.

**Sequences that cross domains** are owned by junctions in code (Section 5). Steps that no code you control can own — in another system, another team's service, or another repository — are recorded where they touch your code: under **Hidden behavior** in the domain where the sequence enters or leaves the system, or, when they span several domains, in an **External sequences** section of `MAP.md`:

```markdown
## External sequences

### Vendor chargeback
1. Card network sends a chargeback webhook    → payments.handleChargeback()
2. Risk team's service (separate repository) reviews the case, 3–5 days
3. Decision event returns                     → ledger.recordChargeback()
```

### What goes in the files

> Write down what the code cannot tell you. Do not restate what it can, unless the restatement is anchored to a test.

- **Freely:** workflows that leave the repository, why a rule exists, traps ("never call X before Y"), business vocabulary, and recipes for common tasks.
- **Anchored:** business rules, in plain English, each with an *Enforced by* test. The agent reads the sentence instead of reverse-engineering the code. The test makes the sentence checkable: a rule whose test no longer exists, or whose test changed while the rule did not, is flagged.

A rule restated without an anchor is a second authority in prose. When the code changes and the sentence does not, the agent trusts the sentence.

### Minimizing code reads

Every line an agent reads costs tokens and attention. Wayfinding keeps code reads small in four ways: the map narrows which files are opened, small code narrows how much of each file is read, reuse means each capability is read once rather than once per copy, and the absence of comments means behavior is read once, in README.md, not twice.

**Code is as small as its decisions.** A domain holds only what its decisions need: no dead code, no speculative abstraction, no wrappers that only forward a call, no second copy of a rule. Small means fewer lines, not shorter names. A name that has to be decoded costs more reading than it saves.

**Code is reused, not rewritten.** Every capability exists once, and every caller reuses it. A near-copy costs an agent twice: it reads both versions, then has to work out which one to change. The map is what makes reuse possible. Before writing new code, the agent looks for an interface that already does the job, and calls it.

Reusable does not mean generic in advance. Code is extracted for reuse when a second caller needs it, not before, so reuse never turns into speculative abstraction.

Shared code lives inside a domain wherever possible. A helper used by several parts of one domain, such as promotions and sales, goes in a `shared/` subfolder of their nearest common parent, here `pricing/shared/`, with its own `README.md` (*Kind: shared*). This keeps the top level to domains and junctions, so it does not grow with every helper. A helper that another top-level domain needs is first offered through the owning domain's interface. A top-level `shared/` folder is a last resort: used only when no single domain can own the helper, and declared in `MAP.md` with the reason. Shared code makes no decisions and imports nothing from its siblings; a helper that starts making a decision moves to the part of the domain that owns it.

**Unused code is removed in the change that makes it unused.** When a refactor or a business-rule change leaves code, tests, or folders with no callers, the same segment deletes them, along with their lines in `README.md`. Version control keeps the history, so nothing is kept just in case.

Two cases wait for a later segment. A public interface with consumers that deploy separately follows expand, then contract (Section 7). Anything with declared consumers the map cannot see, such as another repository, stays until they have moved (Section 9). Removing a whole domain, junction, adapter, or shared folder is a structural change: its own segment, logged in `MAP.md`.

**Code carries no comments.** Behavior is documented once, in README.md, and anchored to tests. A comment is a second, unanchored copy: the agent reads it on every visit, and it drifts silently when the code changes. What a comment would say goes elsewhere:

- why a rule exists → Rules, as its *Why:* line
- traps and surprises → Hidden behavior
- units and meaning → the name: `amountCents`, not `amount // cents`

The only exceptions are lines a tool reads: lint and compiler directives, generated-section markers, and required license headers.

### Keeping the docs small

Moving behavior out of comments only helps if the docs stay small. A bloated `README.md` brings back the problem Wayfinding removes: the agent spends its context on prose instead of code.

The balance runs both ways. Too little, and the agent reverse-engineers the code to find rules and traps. Too much, and it reads lines it does not need on every visit. A `README.md` answers three questions and nothing else: what this folder owns, which rules it enforces, and what will surprise someone working here.

To keep it there:

- **One line per rule.** The rule states what holds; its test carries the detail and the examples. *Why* is one line, not a history, which lives in version control.
- **Every line earns its read.** If deleting a line would not change what an agent does, delete it.
- **Nothing generated is written by hand,** and nothing the code says plainly is restated.
- **What is no longer true is removed.** A hidden behavior that has gone away is deleted in the segment that ends it.
- **Recipes only for tasks that recur.** A one-off procedure belongs in that segment's route, not the `README.md`.

Size is also a boundary signal. A `README.md` that keeps growing usually means its folder owns decisions that change for different reasons. Apply the coherence test: if it fails, split off a child domain or adapter, each with its own small `README.md`; if it passes, trim. Wayfinding sets no fixed limit, but a team can choose a size at which a `README.md` is flagged for review.

### Who updates what

| Section | Updated by | Validated by |
| --- | --- | --- |
| Generated (consumers, interface, tests) | A script, never the agent | CI: regenerated on every commit, fails if stale |
| Rules, Hidden behavior, Recipes | The agent, in the same segment as the code | QA stage |
| Ownership (Owns, Does not own, Mirrors, junction inputs) | The agent, in a separate segment | QA stage, as a boundary change |

Ownership changes get their own segment because a document that always follows the code can never catch the code going wrong. If an agent misplaces a rule and then updates `README.md` to claim the new location, declared and discovered information agree, every guardrail passes, and the mistake becomes policy. Isolating the change makes it visible to QA.

### Keeping the docs current

> The docs are read first and updated last. A segment that changes a business rule without updating its docs is not complete.

A stale doc is worse than no doc: the agent trusts it, and may "fix" correct code to match an outdated sentence. Keeping the files current is therefore part of every segment, not a follow-up task.

### The working loop

```
1. Read       agent instructions → MAP.md → README.md
2. Route      write down decision, domain, consumers, segments
3. Change     code and tests, one segment at a time
4. Document   update Rules, Hidden behavior, Recipes in the same segment
5. Verify     checkpoint passes; mechanical doc checks pass
6. QA         validate the code and the docs together
```

A segment is not complete until step 6 passes. The docs are part of the checkpoint, not an afterthought.

The route is written before any code changes, and QA checks it alongside the diff. A wrong route — the wrong domain, a missing consumer — is the cheapest error to catch: it is a handful of lines, and it explains every downstream mistake in the diff.

### Mechanical doc checks

Step 5 includes checks that need no judgment and run as scripts:

- every *Enforced by* test exists and passes
- every file and function named in a Recipe still exists
- generated sections match a fresh regeneration
- no rule appears in more than one domain's docs
- no comments in code, outside lint and compiler directives, generated-section markers, and license headers
- every domain, child domain, junction, adapter, and shared folder has a README.md with a Kind line
- a README.md past the size the team has chosen is flagged for QA, not failed

### The QA stage

QA validates that the docs still describe the system after the change. Beyond the mechanical checks, it confirms:

- Every change to a business rule has a matching change in **Rules**.
- **Owns** and **Does not own** are unchanged, or the change is isolated in its own segment and consistent with the guardrails.
- Hidden behavior discovered during the work is recorded.
- The route matches what the diff actually did.
- Every line the segment added to a README.md is one an agent needs: no restated code, no rule copied from another folder.
- Code, tests, and folders the change left unused are removed, or their removal is planned as a later segment.

**QA is done by an independent agent by default.** It runs in a fresh context, with instructions different from the coding agent's and ideally on a different model, and sees only the route, the diff, and the docs — not the reasoning that produced them. An agent asked to confirm its own documentation will confirm its own mistakes. With an independent QA agent, the flow needs no person in the loop and adds no waiting.

**A person steps in only when the QA agent cannot decide.** Escalation is the exception path, triggered when:

- the QA agent cannot tell whether a rule change is reflected in the docs
- a rule cannot be anchored to a test, for example because it lives in an external system
- an ownership change conflicts with the map or the guardrails
- the docs and the code disagree and no unmodified test settles which is right

Escalated segments wait; everything else flows straight through. A rising escalation rate is itself a signal that the docs, tests, or domain boundaries need work.

When the docs and the code disagree, a test the segment did not modify is the tiebreaker: whichever side it agrees with is current, and the other side is fixed. If the segment changed both a rule's code and its test, nothing independent remains, so the QA agent judges directly and escalates when in doubt.

### Asynchronous audits

Structural changes — creating, merging, or splitting domains and junctions — are always their own segment and are logged in the Structural changes section of `MAP.md`. They do not wait for approval.

Instead, a person or a differently configured agent periodically reviews a random sample of merged segments, weighted toward ownership and structural changes. Audits catch the errors an independent QA agent can still share with the coding agent, without adding latency to any change. A rising rate of structural changes, or of audit findings, is a signal that boundaries need attention.

### A worked example

Here is the procedure on a realistic request, from ticket to merged change.

**The request.** A ticket arrives:

> Loyalty members get an extra 5% off during holiday promotions. The total discount is still capped at $50. Show the loyalty discount as its own line on the invoice.

**Without the map.** An agent's natural first move is to search for "discount". In a typical codebase that returns dozens of matches: the pricing rules, a discount preview in the web app, a copy of the calculation that someone once added to checkout, the invoice template, and test fixtures. The agent has to guess which one is authoritative. Whichever it picks, nothing tells it that a separate repository depends on the shape of the discount, or that promotion data is overwritten every night.

**Step 1: Read the map.** The agent reads `MAP.md`, a short table that fits in context for every task:

```markdown
| Domain       | Owns                           | Interface                  |
|--------------|--------------------------------|----------------------------|
| pricing      | final price, discounts         | priceFor(), discountFor()  |
| customers    | customer profile, loyalty tier | loyaltyTierFor()           |
| invoice      | invoice layout                 | renderInvoice()            |
| ...          |                                |                            |
```

**Step 2: Split the request into decisions.** The ticket mixes four decisions, and the map says where each one lives:

| Part of the request | Decision | Domain |
| --- | --- | --- |
| Who counts as a loyalty member | Loyalty tier | customers (read only) |
| An extra 5% during holiday promotions | Which promotions apply, and how much | pricing → promotions |
| Total discount capped at $50 | Discount cap | pricing (unchanged, must still hold) |
| Loyalty discount on its own invoice line | Invoice layout | invoice |

**Step 3: Read the domain docs.** The agent opens three `README.md` files: pricing, its child promotions, and invoice. Two lines change the plan before any code is read:

- *pricing, Hidden behavior:* billing-sync (separate repository) re-prices open invoices nightly using `discountFor()`. Changing its signature breaks billing-sync.
- *promotions, Hidden behavior:* Promo codes are imported nightly from the marketing tool. Direct edits to `pricing_promotions` are overwritten by the import.

The first means `discountFor()` can be extended but not changed. The second means the loyalty bonus cannot simply be a row in the promotions table; it has to be a rule in code.

**Step 4: Write the route.** Before touching code, the agent writes down what it will change:

```
Requirement:  Loyalty members get an extra 5% off during holiday promotions;
              cap unchanged; loyalty discount shown on its own invoice line

Domains:      pricing/promotions   loyalty bonus rule
              pricing              discount breakdown in the interface; cap unchanged
              invoice              render the breakdown
              customers            read only, through loyaltyTierFor()

Consumers of pricing.discountFor():
              cart, checkout, invoice, order-total      (discovered)
              billing-sync                              (declared, external)

Segments:
  1. promotions  Add the loyalty bonus rule; return it as its own line
  2. pricing     Add a `lines` breakdown to Discount, alongside `amount`;
                 apply the $50 cap to the total
  3. invoice     Render one line per discount
```

There is no fourth segment to remove anything. `amount` stays, so billing-sync and every other consumer keep working unchanged.

**Step 5: Change, one segment at a time.** Each segment touches only its own domain and ends with its checkpoint passing:

| Segment | Files changed | Checkpoint |
| --- | --- | --- |
| 1. promotions | `service.ts`, `service.test.ts`, `README.md` | promotions tests |
| 2. pricing | `service.ts`, `service.test.ts` | pricing tests, consumer tests |
| 3. invoice | `service.ts`, `service.test.ts` | invoice tests |

In segment 1, the docs change with the code. The promotions `README.md` gains a rule anchored to its test:

```markdown
- Loyalty members get an extra 5% during holiday promotions.
  Why: loyalty program, holiday 2026.
  Enforced by: service.test.ts › "loyalty bonus applies during holiday promotion"
```

In segment 2, the cap test gains a new case: a loyalty member whose combined discount would exceed $50. The existing rule is proven to still hold.

**Step 6: Verify and QA.** On the first run, the mechanical checks catch one problem. Segment 3 imported `pricing/promotions` directly to get the loyalty line, and a structural guardrail forbids reaching a child domain from outside its parent. The fix is to read the line from `pricing.discountFor()`, which segment 2 already exposes. On the second run the checks pass, and the independent QA agent compares the route, the diff, and the docs. It confirms that:

- the new promotion rule is recorded in promotions' Rules, with its test
- the cap rule in pricing is unchanged and still enforced
- `discountFor()` keeps its signature, as billing-sync requires
- the route matches what the diff actually did

**What the map changed.** The agent read one index, three domain docs, and the handful of files its segments touched. It knew about the external consumer and the nightly import before writing any code. Its one mistake was caught by a guardrail during the change, not by a customer after release.

### Right-sizing

Not all of this is needed on day one. A prototype needs agent instructions, `MAP.md`, and `README.md` with anchored rules. Formal segment declarations, the QA stage, and semantic guardrails earn their cost once the system ships or grows large enough to drift. A useful rule: a decision gets a domain when a second place needs it.

## 13. Legacy Systems

Wayfinding does not require rewriting an existing system. It can be introduced one domain at a time, connected to legacy code by an explicit **adapter**:

```
New Domain
      ↓
Adapter
      ↓
Legacy Code
```

The first goal is not to reorganize everything. It is to establish ownership for the next change.

1. Identify an important decision.
2. Find where it is decided today, or choose where it should be.
3. Draw a domain around it.
4. Identify known consumers.
5. Plan the change as segments.
6. Add the domain to the map.
7. Add guardrails for the new boundary.
8. Move further decisions into domains as later changes require them.

Legacy code starts out largely off the map. That is acceptable: the map grows with every change, and the architecture improves through normal development rather than a separate migration project.

### Legacy data

A shared legacy database is usually the hardest part. On day one, many legacy tables are written from many places, which breaks the one-writer rule everywhere. Wayfinding does not demand that this be fixed first:

- **Declare shared tables** in a *Legacy tables* section of `MAP.md`, listing their current writers.
- **Treat existing writers as declared exceptions.** Guardrails flag only new writers, so the exception list can shrink but never grow.
- **Migrate one table at a time.** A domain becomes the table's writer and the others go through an adapter. When the last outside writer is gone, the table moves into the domain and takes its prefix.

## 14. Adoption

Wayfinding can be adopted one change at a time: for each change, walk the route in Section 6 as a checklist.

This can begin as a manual process. As the architecture matures, tooling can discover and check more of the answers.

The tooling is not the point. The point is that the questions have explicit answers.

## 15. Measuring It

Wayfinding makes a testable claim: systems with explicit ownership and bounded change are easier to change safely. That claim should be measured, not just asserted. Candidate measures, compared before and after adoption or between parts of a system with and without domains:

| Measure | What it tests |
| --- | --- |
| Time to locate the domain that owns a decision | Location friction |
| Domains touched per change | Scope friction |
| Changes that touch undeclared consumers | Accuracy of the map |
| Change failure rate | Safety of segments |
| Time to diagnose a failed change | Blast-radius claim |
| Agent task success rate, with and without the map | The AI hypothesis |
| Routes corrected by QA | Quality of routing |
| QA escalation rate | Health of docs, tests, and boundaries |
| Domain count and ownership changes per week | Structural drift |

None of these requires special infrastructure; most can be derived from version control and CI history. Results from even one team would turn the paper's central hypothesis into evidence.

## 16. Example Tooling

Wayfinding does not require a specific toolchain. This section is an illustration, not part of the architecture.

A supporting tool might offer commands such as:

```
wayfind map                       # scan the repository and update MAP.md
wayfind map --check               # fail if discovered and declared information disagree
wayfind who-uses pricing          # list discovered and declared consumers
wayfind find savings              # locate the domain that owns a term or decision
wayfind route pricing.discountFor # propose a route for a change
wayfind segment --check           # compare a change against its declared segment
```

The map is only as trustworthy as its discovery, so real tooling should derive structure from compiler or AST APIs where available. Existing architecture-rule tools can implement most structural guardrails today.

The architectural requirement is not any particular command. It is that ownership, domains, consumers, and segments can be inspected and checked.

## 17. Where Wayfinding Fits

Wayfinding is technology-neutral. It complements other architectural styles rather than replacing them, and it can be applied within modular monoliths, domain-driven design, vertical slices, hexagonal architecture, layered systems, service-oriented systems, and microservices.

Those approaches answer different questions:

- How should responsibilities be organized?
- Where should infrastructure dependencies live?
- How should domains be separated?
- When should systems be distributed?

Wayfinding asks a different one:

> How can the ownership, impact, and scope of a change be made explicit and discoverable?

In particular, Wayfinding is an operating layer that works with or without domain-driven design. Use DDD, or any other method, to decide where boundaries go. Wayfinding makes those boundaries navigable, checkable, and safe to change, by people and by agents.

A domain may eventually become a service, but distribution is not required for architectural clarity.

> Prove the boundary inside the application before paying the cost of distributing it.

## 18. Related Work and What Is New

The individual ideas behind Wayfinding are not new, and the paper does not claim they are.

- **Wayfinding** as a discipline comes from Lynch's study of how people navigate cities. His observation that people navigate by landmarks, and by the points where routes meet, inspired the domains, junctions, and routes here (Section 2).
- **Information hiding** (Parnas, 1972) argued that modules should be drawn around design decisions that are likely to change. Decision ownership is a close descendant of that idea.
- **Don't Repeat Yourself** (Hunt and Thomas) asks that every piece of knowledge have a single authoritative representation. Wayfinding agrees in substance but uses the words differently: in this paper, *representation* means a copy of a value, and *authority* means the decision that produces it. Duplicate representation is fine; duplicate authority is not.
- **The single-responsibility principle** supplies the coherence test for domains: things that change for the same reason belong together.
- **Bounded contexts** in domain-driven design draw boundaries around consistent models and language. A Wayfinding domain is drawn around decision ownership instead. The two often coincide, but the test differs: who owns the decision, not which model it belongs to.
- **Code navigation research** has borrowed wayfinding ideas before. TagSEA (Storey et al., 2007) let developers create shared waypoints through source code.
- **Hexagonal architecture** (Cockburn, 2005) separates an application's core from the adapters that connect it to the outside world. Wayfinding borrows only the adapter idea, as a way to tell decisions from the code that carries data in and out (Section 4).
- **Architecture-rule tools** already check dependency rules mechanically and can implement most structural guardrails.

Wayfinding's proposed contribution is the way these are organized around a single problem, change navigation:

```
Decision Ownership + Domains + Junctions + Map + Segments + Guardrails
```

### Wayfinding and domain-driven design

The structural half of Wayfinding overlaps heavily with domain-driven design. A reader who knows DDD will recognize most of it:

| Wayfinding | Closest DDD idea |
| --- | --- |
| Domain with its own data | Bounded context with its own storage |
| One writer per table | Data owned by a single context or aggregate |
| Child domain | Subdomain, or a context nested in a larger one |
| Junction | Domain service, or a context that coordinates others |
| Adapter to legacy code | Anti-corruption layer |
| Read view | Open host service and published language |

The difference is the question each answers. DDD asks *how do we model the business correctly?* Its effort goes into ubiquitous language, strategic design, and tactical patterns such as aggregates and repositories, and it says little about the act of changing code.

Wayfinding asks *how does a change move safely through the system?* That is where its contribution lies:

- **The route:** one path from requirement to checkpoint.
- **Segments:** declared, reversible units of change that leave the system shippable between steps.
- **Junctions:** every combination rule belongs to exactly one domain, which closes the seam where consistent inputs produce inconsistent results.
- **The map and guardrails:** ownership that machines can read and check, with drift detected instead of discovered.
- **The agent operating procedure:** the files, the working loop, independent QA, and rules anchored to tests.

Wayfinding also asks for no upfront modeling. It can be adopted one change at a time, in a codebase that has never used DDD.

### The hypothesis

AI coding agents sharpen the motivation, because they expose a weakness that humans have long compensated for with experience. An experienced developer may simply know that the discount rule belongs in pricing and that checkout only consumes it. An agent cannot safely assume that knowledge unless the system makes it discoverable.

The claim is not that AI requires a new architecture. It is the thesis stated at the start: one findable place for every decision and a clear scope for every change make software faster and safer to change, for people and agents alike. That is a hypothesis, and Section 15 describes how to test it.

## 19. What Wayfinding Is Not

Wayfinding is not:

- a programming language or a framework
- an AI coding framework or a set of AI prompt rules
- a context budget or a limit on how much an agent may read; it reduces what there is to read rather than capping it
- a specific set of naming, file-size, or directory conventions; some convention is needed so guardrails can check it, but which one is yours to choose
- a replacement for testing
- a guarantee that static analysis captures every runtime dependency
- a requirement that every change fit within a fixed number of files or lines
- a team-ownership model, though it can be mapped onto one

Conventions, specific tools, API description formats, and message catalogs can all help implement Wayfinding. None of them is an architectural pillar.

The goal is not maximal formalism. The goal is low-friction, controlled change.

## 20. Summary

**Software changes faster and more safely when every decision lives in one place you can find and every change has a clear scope.**

Wayfinding turns that claim into an architecture that makes the ownership, impact, and scope of software changes explicit, discoverable, and enforceable.

It is built around three questions:

- *Where does this change belong?*
- *What can it affect?*
- *How much should change at once?*

It answers them with a single route:

```
Requirement → Decision → Domain → Interface → Consumers → Segment → Change → Checkpoint
```

Its foundational principle is:

> Every important decision is owned by exactly one domain.

For humans, this reduces architectural friction. For AI agents, it reduces how much of the repository they must read and reconstruct before making a change. For both, the result is the same: a shorter, more predictable route from requirement to safe change.

## References

- Lynch, K. (1960). *The Image of the City*. MIT Press.
- Parnas, D. L. (1972). On the criteria to be used in decomposing systems into modules. *Communications of the ACM*, 15(12).
- Hunt, A. and Thomas, D. (1999). *The Pragmatic Programmer*. Addison-Wesley.
- Martin, R. C. (2003). *Agile Software Development: Principles, Patterns, and Practices*. Prentice Hall.
- Evans, E. (2003). *Domain-Driven Design*. Addison-Wesley.
- Cockburn, A. (2005). [Hexagonal Architecture](https://alistaircockburn.com/Articles/Hexagonal-Architecture).
- Storey, M.-A., et al. (2007). [How Programmers Can Turn Comments into Waypoints for Code Navigation](https://dominoweb.draco.res.ibm.com/reports/rc24399.pdf). IBM Research Report RC24399.
