# How to change this codebase

This repository follows Wayfinding Architecture. Every important decision is
owned by exactly one domain. Find it before you change it.

## Before writing code

1. Read `MAP.md` and find the domain that owns the decision you are changing.
2. Read that domain's `README.md`: Rules, Hidden behavior, Recipes. If the
   decision lives in a child domain, read the parent's `README.md` first.
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
- Reach other domains only through their `service.ts`. Never import another
  domain's `model.ts`, its adapters, or its child domains.
- Never re-implement another domain's decision; call it.
- Before writing new code, look for an interface or shared helper that
  already does the job, and reuse it. `npm run check` fails on the same
  function written in two folders.
- Put a shared helper in the `shared/` folder of the nearest parent of its
  callers, with a `README.md` (`Kind: shared`). Use the top level only if no
  domain can own it, and declare it in `MAP.md`.
- Write only the code the decision needs, and no comments; behavior goes in
  `README.md`.
- HTTP routes are adapters: `routes/` inside each domain, calling only that
  domain's `service.ts`. Keep business rules out of them.
- Read and write a table only from the service of the domain that owns it.
- Every folder of code has a `README.md` with a Kind line: domain, child
  domain, junction, adapter, or shared.
- If no domain owns the decision and only one place uses it, record it under
  that domain's "Owns". Create a new domain only when a second place needs it;
  do it in its own segment and log it in `MAP.md`.
- If `README.md` and the code disagree, a test this segment did not modify
  decides. Fix whichever side is wrong and note the correction.
- Work one segment at a time. Each segment ends with its checkpoint passing.

## Before finishing

- Update Rules, Hidden behavior, and Recipes in every `README.md` you
  touched, in the same segment as the code. Anchor every rule to a test.
- Never edit generated sections (Contains, Consumers); run
  `npm run docs:regen`.
- Keep each `README.md` small: one line per rule, and delete what is no
  longer true.
- Delete code, tests, and folders this segment left unused, unless a declared
  consumer still needs them.
- Put any change to "Owns" or "Does not own" in its own segment.
- Run `npm test` and `npm run check`.
- Hand the route, the diff, and the docs to QA.

## Commands

- One domain's tests: `npm run checkpoint -- <domain>` (for example `pricing/promotions`)
- All tests: `npm test`
- Mechanical checks: `npm run check`
- Regenerate generated sections: `npm run docs:regen`
