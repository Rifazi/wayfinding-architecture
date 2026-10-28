# Changelog

All notable changes to the paper are recorded here. Versions follow
`MAJOR.MINOR`: a major version changes a core concept or term; a minor version
adds or clarifies material without changing what existing terms mean.

## 1.2 — 2026-10-28

Replaces the 1.1 text with a revised paper. Each folder's map file is renamed
from `DOMAIN.md` to `README.md`; what the map holds does not change.

- The map: every domain, child domain, junction, adapter, and shared folder has
  one `README.md` (was `DOMAIN.md`) that opens with a *Kind* line. A generated
  **Contains** section replaces the *Child domains* header line.
- Section 4: **decisions and adapters**. Code is either a decision or an adapter
  that connects a domain to something outside it. Adapters with something to
  document get their own folder: routes move from `routes.ts` to a `routes/`
  adapter. Each external system is reached through one domain's adapter, named
  in `MAP.md` under *External systems*.
- Section 12: **minimizing code reads**. Code is as small as its decisions,
  carries no comments, and is reused rather than rewritten. Shared helpers live
  in a `shared/` folder inside the domain that uses them; a top-level one is a
  last resort, declared in `MAP.md`. Unused code, tests, and folders are removed
  in the change that makes them unused.
- Section 12: **keeping the docs small**. One line per rule, every line earns
  its read, and a growing `README.md` is a boundary signal.
- Section 10: new guardrails for dead code, adapters reached from outside their
  domain, an external client imported from more than one domain, and shared
  code that imports its siblings. Doc checks for comments in code, a missing
  *Kind* line, and a `README.md` past the team's size limit (flagged for QA).
- Section 18: hexagonal architecture is credited for the adapter idea.
- Removed from 1.1: one copy of every helper (Section 3), every folder of code
  is a child domain, splitting a domain that has grown, the generated Files
  section, finding code, empty means absent, many agents at once, and the
  first field report. They remain in the history of this repository.
- Templates and example: `README.md` with *Kind* lines and generated Contains
  sections, `routes/` adapters, no comments in code, and `example/tools/check.ts`
  updated for the new guardrails.

## 1.1 — 2026-10-18

Adds material from running Wayfinding with AI agents on real repositories. No
existing term changes meaning.

- Section 3: **one copy of every helper**. Duplicate authority also hides in
  plumbing (request parsing, response shaping); a helper two domains need moves
  into a domain both import, and copying is a declared mirror.
- Section 4: a public interface is one explicit file (`service.ts` is only the
  example's name); every folder of code is a child domain; a parent stays thin;
  **splitting a domain that has grown**; shared code between children becomes a
  sibling child, and between top-level domains a top-level domain.
- Section 8: the generated **Files** section, with signatures of the public
  file's exports, so callers read a signature instead of the code.
- Section 10: new mechanical guardrails (identical functions in two domains,
  code in a folder with no `DOMAIN.md`, ownership edits reported to QA) and a
  semantic one (near-copies).
- Section 12: a fixed order for **finding code**; **empty means absent** in
  `DOMAIN.md`; **many agents at once** (parallel build and parallel QA);
  escalation when a fix keeps failing QA on the same finding.
- Section 13: adopt a domain's docs when a change first touches its folder.
- Section 15: measures for files opened per change and duplicated functions,
  and a first field report.
- Templates and example: lean `DOMAIN.md`, finding-code and helper rules in
  `AGENTS.md`, and `example/tools/check.ts` generates Files, drops empty
  sections, and fails on duplicated helpers and undocumented code folders.

## 1.0 — 2026-10-10

First public version.

- Core principle: every important decision is owned by exactly one domain.
- Domains, child domains, and junctions; one writer per table; read views.
- The route, segments, the map (`MAP.md`, `DOMAIN.md`), and guardrails.
- Operating procedure for AI agents, with an independent QA agent and a worked example.
- Templates and a runnable example: an Express app using TypeORM, with one
  `model.ts`, `service.ts`, and `routes.ts` per domain.
