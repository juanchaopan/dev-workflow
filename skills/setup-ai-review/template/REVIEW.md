# Review standards

The AI reviewers (the cloud review on PRs and local code-review) read this file every time. It holds only this project's own review requirements; general conventions are in CLAUDE.md and `.claude/rules/`.

## Comment language

{{The language for review comments, e.g. English}}

## What counts as "bad" in this project

- {{e.g. a field name or type in an API response changed, so callers break}}
- {{e.g. amounts calculated with floating point}}
- {{e.g. a command in the documentation does not work — the documentation lies}}
- {{e.g. a wrong setting sends requests to the wrong environment — the configuration misroutes traffic}}

## Focus on

- Bug fixes: is the root cause fixed, not just the symptom?
- New logic: are there tests, and would they really fail if the code were wrong?
- Architecture: does it follow the layering in `.claude/rules/` and the accepted decisions in `docs/adr/`? Architecture checks only see dependencies; also look for what they cannot see, such as business logic hidden in presentational components, pages full of styles, or services building HTTP responses.
- Design (when the project has `docs/design/`): does behavior users can see match the design — fields, order, text, validation rules and error messages of screens; fields, error codes and permissions of interfaces; columns and constraints of data; decision tables and state transitions of business logic? Report [Important] when it differs and the PR neither changes the design nor explains why. Also report design validation rules and decision table rows without matching tests.
- CLAUDE.md: does the code break its conventions, and does anything in it no longer match the code?
- {{project-specific focus}}

## Patchwork and bloat

AI-written code tends to look more and more patched over time. Report these:

- [Important] Conditionals and parameters appended to an existing function to support a new case, making it longer and longer, instead of restructuring.
- [Important] New code that duplicates existing code, or a second way of doing the same thing.
- [Important] Dead code, commented-out code, unused parameters and branches, code kept only for compatibility with an old implementation.
- [Important] Excessive abstraction or configurability for something used once.
- [Nit] Comments written as change logs ("changed to...", "added...", "previously...") or describing the change rather than the code.

## Do not report

- Pure formatting and style; lint and formatters handle those.
- "Could be written better" that does not affect correctness, unless marked Nit.
- More than {{3}} Nits per review.

## Paths to skip

- {{build output directories, e.g. dist/}}
- {{lock files, e.g. package-lock.json}}
- {{generated code}}

## Evidence

- Every finding names the file and line and says which input or steps trigger it.
- Do not report problems guessed from names alone. When unsure, read the related code first.
- When the same problem appears in several places, list every location and ask for them to be fixed together.

## Summary format

- The first sentence is "Found N problems". With none, write "Found 0 problems, no changes needed"; never invent problems to fill the count.
