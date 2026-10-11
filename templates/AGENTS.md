# How to change this codebase

This repository follows Wayfinding Architecture. Every important decision is
owned by exactly one domain. Find it before you change it.

## Before writing code

1. Read `MAP.md` and find the domain that owns the decision you are changing.
2. Read that domain's `DOMAIN.md`: Rules, Hidden behavior, Recipes. If the
   decision lives in a child domain, read the parent's `DOMAIN.md` first.
3. Write down the route:

   ```
   Requirement:  <the request, in one or two lines>
   Domains:      <domain>   <what changes there>
   Consumers:    <discovered and declared consumers of any interface you change>
   Segments:     1. <domain>  <change>
                 2. ...
   ```

   If the request mixes several decisions, split it first: one line per
   decision, with the domain that owns it.

## While changing code

- Change a decision only in its owning domain.
- Reach other domains only through their public interface (in the paper's
  layout, `service.ts`). Never import another domain's model or routes.
- From outside a parent domain, never import its child domains.
- Never re-implement another domain's decision; call it.
- Write a table only from the domain that owns it.
- If no domain owns the decision and only one place uses it, record it under
  that domain's "Owns". Create a new domain only when a second place needs it;
  do it in its own segment and log it in `MAP.md`.
- If `DOMAIN.md` and the code disagree, a test this segment did not modify
  decides. Fix whichever side is wrong and note the correction.
- Work one segment at a time. Each segment ends with its checkpoint passing.
- Prefer expand/contract: add the new shape alongside the old, move
  consumers, then remove the old shape in a later segment.

## Before finishing

- Update Rules, Hidden behavior, and Recipes in every `DOMAIN.md` you touched,
  in the same segment as the code. Anchor every rule to a test
  (`Enforced by: <test file> › "<test name>"`).
- Never edit generated sections; regenerate them.
- Put any change to "Owns" or "Does not own" in its own segment, so QA sees
  it separately.
- Run the checkpoint and the mechanical checks.
- Hand the route, the diff, and the docs to QA.

<!-- Replace with your project's commands. -->
## Commands

- Run one domain's tests: `<command> <domain>`
- Run the mechanical checks: `<command>`
- Regenerate generated sections: `<command>`
