# Contributing

Wayfinding is a proposal, and it gets better with pushback. The most useful
contributions are:

- **Counterexamples.** A real change that the route, domains, or segments
  handle badly.
- **Field reports.** You tried Wayfinding on a codebase, with or without AI
  agents. What helped, what got in the way, and what you measured
  (Section 15 lists suggested metrics).
- **Unclear passages.** Point to the sentence and say what you thought it meant.
- **Tooling.** Implementations of the mechanical checks for other languages or
  build systems.

## How

- Questions and open-ended discussion: use GitHub Discussions.
- Specific problems with the text: open an issue and quote the passage.
- Fixes to typos, the templates, or the example: open a pull request.

Changes to core terms (domain, junction, adapter, segment, route, map) are made in a
major version and recorded in `CHANGELOG.md`.

## Terminology

The paper uses one term per concept. Please keep to it in contributions:
**domain** (not owner, module, or landmark), **child domain**, **junction**,
**adapter**, **shared**,
**segment**, **requirement**, **route**, **map**, **discovered** and
**declared**. The city metaphor explains the terms; it does not replace them.
