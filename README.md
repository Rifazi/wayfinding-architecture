# Wayfinding Architecture

**Software changes faster and more safely when every decision lives in one place you can find and every change has a clear scope.**

Wayfinding is an architectural approach built on that claim, for people and AI agents alike. It makes the ownership, impact, and scope of software changes explicit, discoverable, and enforceable.

📄 **[Read the white paper](paper/wayfinding-architecture.md)** · PDF on the [Releases](../../releases) page

## The idea in one minute

People navigating a city do not walk street by street; they head for landmarks they can find. In a codebase, the streets are files, imports, and keyword searches. The landmarks are **domains**: the one place each decision lives.

The foundational principle:

> Every important decision is owned by exactly one domain.

Every change answers three questions:

1. **Where does this change belong?** The domain that owns the decision.
2. **What can it affect?** That domain's consumers, discovered and declared.
3. **How much should change at once?** One segment: a step that can be validated and reverted on its own.

Together they form a **route** from requirement to checkpoint:

```
Requirement → Decision → Domain → Public Interface → Consumers → Segment → Change → Checkpoint
```

| Concept | What it is |
| --- | --- |
| Domain | Owns a set of decisions and the data they need. Only it writes its own data. |
| Child domain | A domain inside a domain, with the same layout; visible only to its parent. |
| Junction | A domain whose rules combine other domains' decisions, such as an order total. |
| Map | `MAP.md` and one `DOMAIN.md` per domain: discovered from code, declared by people, checked by tools. |
| Segment | A bounded, independently validatable and revertible step of a larger change. |
| Guardrails | Structural checks run by tools; semantic checks decided by an independent QA agent. |

## For AI agents

Section 12 of the paper is an operating procedure for agents. The agent reads `AGENTS.md`, then `MAP.md`, then the relevant `DOMAIN.md` files *first*; it updates them *last*; and an independent QA agent validates the code and the docs together. A person steps in only on escalation.

## What's in this repository

| Path | Contents |
| --- | --- |
| [`paper/`](paper/) | The white paper |
| [`templates/`](templates/) | Copy-ready `AGENTS.md`, `MAP.md`, and `DOMAIN.md` to adopt Wayfinding in your own repository |
| [`example/`](example/) | A small Express + TypeORM app laid out the Wayfinding way, with tests and the mechanical checks as a script |

### Try it in five minutes

```bash
cd example
npm install
npm test        # run every domain's tests (Node 22.18+; no database server needed)
npm run check   # run the mechanical guardrails and doc checks
```

Then give your coding agent the ticket from the paper's worked example (Section 12) and watch it walk the route:

> Loyalty members get an extra 5% off during holiday promotions. The total discount is still capped at $50. Show the loyalty discount as its own line on the invoice.

## Status and feedback

Version 1.0. This is a proposal, and its central claim is a hypothesis (Section 18). Feedback, counterexamples, and reports from teams that try it are very welcome: see [CONTRIBUTING.md](CONTRIBUTING.md).

## Citing

Use GitHub's **Cite this repository** button, or see [`CITATION.cff`](CITATION.cff).

## License

The paper is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The templates, example code, and tooling are licensed under the MIT License. See [LICENSE](LICENSE) and [LICENSE-CODE](LICENSE-CODE).
