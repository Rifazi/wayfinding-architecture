# Templates

Copy-ready files for adopting Wayfinding in your own repository. Section 12 of
the paper explains each one.

| File | Put it | Purpose |
| --- | --- | --- |
| `AGENTS.md` | Repository root (or whatever file your agent tool loads automatically, such as `CLAUDE.md`) | Teaches the agent the route and the working loop |
| `MAP.md` | Repository root, or the root of your source folder | One line per top-level domain and junction |
| `folder/README.md` | As `README.md` in every folder of code: domains, child domains, junctions, adapters, and shared folders | The folder's map entry: Kind, ownership, rules, hidden behavior, recipes, and generated sections |

## Getting started

1. Copy `AGENTS.md` to the repository root.
2. List your top-level domains in `MAP.md`. Start with the five or six that
   change most often; the map does not have to be complete on day one.
3. Copy `folder/README.md` into each of those domains as `README.md`. Fill in
   **Kind**, **Owns**, **Does not own**, and **Interface** first. Add **Rules**
   only with an *Enforced by* test; a rule without a test is a second authority
   in prose.
4. Write down the **Hidden behavior** that the code cannot tell you: nightly
   jobs, other repositories that depend on you, imports that overwrite data.
   This is the highest-value part of the file.
5. Give adapters (HTTP routes, clients for external systems) their own folder
   and `README.md` with `Kind: adapter`.
6. Wire up the mechanical checks (see `example/tools/check.ts` for a working
   version) and run them in CI.

Keep every `README.md` small. Delete the `<!-- comments -->` as you fill each
file in.
