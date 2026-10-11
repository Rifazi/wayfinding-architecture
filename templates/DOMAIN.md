# <domain>

<!--
The header lines are the domain's map entry. Keep them to one line each.
For a junction, add:  Kind: junction   and   Inputs: <domain>.<fn>(), ...
-->
Parent: <parent domain, or "none (top-level domain)">
Owns: <the decisions this domain makes>
Owns data: <tables this domain writes, or "none">
Child domains: <names, or "none">
Does not own: <nearby decisions that live elsewhere (see <domain>)>
Interface: <public functions>
Checkpoint: <command that runs this domain's tests>

## Rules
<!--
Business rules in plain English. Every rule is anchored to a test.
A rule whose test disappears, or whose test changes while the rule does not,
is flagged by the mechanical checks.
-->
- <rule>
  Why: <reason, source, or date>
  Enforced by: <test file> › "<test name>"

## Hidden behavior
<!--
What the code cannot tell you: scheduled jobs, external consumers, data that
is overwritten by imports, traps ("never call X before Y").
-->
- <behavior>

## Recipes
<!-- Step-by-step instructions for the changes people make most often. -->
### <common task>
1. <step>
2. Add a test named after the rule
3. Add the rule to "Rules" with its test
4. Run the checkpoint

## Mirrors
<!-- Declared copies of a decision elsewhere, and which side wins. -->
- none

## Consumers
<!-- generated: do not edit -->
<!-- end generated -->
