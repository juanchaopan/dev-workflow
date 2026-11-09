## Type

{{Feature / Bug / Refactoring / Chore / Spike}}

## Goal

{{What the user can do once it is done, in a sentence or two. Refactoring: "restructure into what, and why"; spike: "the question to answer"; data migration: "which data moves where".}}

## Requirements and design

- Requirements: {{REQ-xxx title}}
- Design: {{SCR-xxx (docs/design/screens/SCR-xxx-name.md, confirmed screenshot SCR-xxx-name.png), API-xxx, ENT-xxx, JOB-xxx, LGC-xxx; for code structure redesigns docs/design/refactor/xxx.md; related decisions ADR-xxxx}}
- Current system: {{for an existing system, the old elements it replaces (CUR-xxx in docs/design/as-is/) and the "From the current system" decisions it implements; "None" otherwise}}
- {{When a screen is "AI draft, awaiting confirmation": have the user confirm SCR-xxx before starting}}

## Acceptance criteria

- [ ] Given {{precondition}}, When {{action}}, Then {{result}}
- [ ] Given {{precondition}}, When {{invalid action}}, Then {{how the system responds}}
- [ ] {{All rules of fields N to M in the SCR-xxx field definitions / every error case of API-xxx / every row of the LGC-xxx decision table}}
- [ ] {{With screens: the implemented screen matches the confirmed screenshots (fields, order, text, every state)}}
- [ ] {{Existing system: every kept old rule gives the same result as its worked example; every changed rule gives its new result}}

{{Refactoring: behavior unchanged; the same tests pass before and after. Spike: the criteria for success and failure. Data migration: row counts and totals match between old and new, every mapped dirty-data case is handled, and the migration can be rerun.}}

## Components and files

- `{{component directory}}`: {{what to do}}
- Expected files: {{main files or directories this issue will change}}

## Dependencies

- {{#number, or "None"}}

## Size and risk

- Size: {{S / M}}
- Estimated risk tier: {{low / medium / high}}, {{reason}}

## Test points

- {{normal paths, boundaries and failures to cover; boundary values of validation rules, e.g. the length limit and the limit plus one; for kept old rules, the old worked examples as test cases}}
