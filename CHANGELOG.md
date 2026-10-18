# Changelog

All notable changes to the paper are recorded here. Versions follow
`MAJOR.MINOR`: a major version changes a core concept or term; a minor version
adds or clarifies material without changing what existing terms mean.

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
