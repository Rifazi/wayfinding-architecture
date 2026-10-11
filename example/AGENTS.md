# How to change this codebase

This repository follows Wayfinding Architecture. Every important decision is
owned by exactly one domain. Find it before you change it.

## Before writing code

1. Read `MAP.md` and find the domain that owns the decision you are changing.
2. Read that domain's `DOMAIN.md`: Rules, Hidden behavior, Recipes. If the
   decision lives in a child domain, read the parent's `DOMAIN.md` first.
3. If the request mixes several decisions, split it: one line per decision,
   with the domain that owns it.
4. Write down the route:

   ```
   Requirement:  <the request>
   Domains:      <domain>   <what changes there>
   Consumers:    <discovered and declared consumers of any interface you change>
   Segments:     1. <domain>  <change>
   ```

## While changing code

- Change a decision only in its owning domain.
- Reach other domains only through their `service.ts`. Never import another domain's `model.ts` or `routes.ts`.
- From outside a parent domain, never import its child domains.
- Never re-implement another domain's decision; call it.
- Read and write a table only from the service of the domain that owns it.
- Every domain has the same files: `model.ts` (TypeORM entities), `service.ts` (interface and rules),
  `routes.ts` (HTTP), `service.test.ts`, `DOMAIN.md`. No model if it stores nothing; no routes if it has no endpoints.
- If no domain owns the decision and only one place uses it, record it under
  that domain's "Owns". Create a new domain only when a second place needs it;
  do it in its own segment and log it in `MAP.md`.
- If `DOMAIN.md` and the code disagree, a test this segment did not modify
  decides. Fix whichever side is wrong and note the correction.
- Work one segment at a time. Each segment ends with its checkpoint passing.

## Before finishing

- Update Rules, Hidden behavior, and Recipes in every `DOMAIN.md` you touched,
  in the same segment as the code. Anchor every rule to a test.
- Never edit generated sections; run `npm run docs:regen`.
- Put any change to "Owns" or "Does not own" in its own segment.
- Run `npm test` and `npm run check`.
- Hand the route, the diff, and the docs to QA.

## Commands

- One domain's tests: `npm run checkpoint -- <domain>` (for example `pricing/promotions`)
- All tests: `npm test`
- Mechanical checks: `npm run check`
- Regenerate generated sections: `npm run docs:regen`
