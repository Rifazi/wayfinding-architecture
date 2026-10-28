# Map

<!--
One line per top-level domain and junction. Child domains, adapters, and
shared folders are listed in their parent's README.md, not here. Keep this
file short enough to read in full on every task.
-->

| Domain | Owns | Interface |
| --- | --- | --- |
| <domain> | <the decisions it owns> | <public functions> |
| <junction> | junction: <what it combines> | <public functions> |

## Structural changes

<!-- Every created, merged, split, or promoted domain, newest first. -->
- YYYY-MM-DD  created <domain>: <one-line reason>

<!--
Add these sections only when you need them:

## Legacy tables
Tables with more than one writer, until they are migrated (Section 13).
- <table>: written by <domain>, <domain> (declared exceptions)

## External sequences
Workflows that cross domains and leave the code you control.
### <name>
1. <step>    → <domain>.<function>()
2. <step in an external system>

## External systems
Each outside system, and the one domain whose adapter reaches it.
- <system>: <domain>/<adapter>

## Shared
A top-level shared folder is a last resort. Declare it here with the reason.
- shared: <why no single domain can own these helpers>
-->
