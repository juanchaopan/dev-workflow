# {{redesign title}}

- Date: {{YYYY-MM-DD}}
- Status: {{Draft / Confirmed / Done}}
- Requirements: {{REQ-xxx}}
- Decisions: {{ADR-xxxx}}

## Why redesign

{{What the new requirement is and why the current design cannot take it: e.g. which conditionals would keep piling up, which duplication would appear, which interfaces cannot express the new concept.}}

## Current design

```mermaid
classDiagram
  class {{ExistingClass}} {
    +{{method}}()
  }
```

{{Today's classes, interfaces, module boundaries and data structures, and their problems.}}

## Target design

```mermaid
classDiagram
  class {{NewInterface}} {
    <<interface>>
    +{{method}}()
  }
  {{NewInterface}} <|.. {{ImplementationA}}
  {{NewInterface}} <|.. {{ImplementationB}}
```

{{Each class and interface's responsibility, dependency directions and extension points. Say what changes, and what does not, when another requirement of the same kind arrives.}}

## Interfaces before and after

| Interface | Now | Becomes | Compatibility |
|---|---|---|---|
| `{{interface or method}}` | `{{old signature}}` | `{{new signature}}` | {{old and new coexist until step N / replaced directly (no external callers)}} |

## Data structure changes

{{Changes to tables, columns and message formats; how they are staged as "expand → migrate → contract"; what happens to old data. "None" when there are none.}}

## Migration steps

| Step | Content | Behavior changes | Issue |
|---|---|---|---|
| 1 | Characterization tests: {{behavior to pin down}} | no | #{{number}} |
| 2 | Refactoring: {{what is restructured}} | no | #{{number}} |
| 3 | Expand: {{which new interface is added}} | no | #{{number}} |
| 4 | Migrate: {{which callers move}} | no | #{{number}} |
| 5 | Contract: {{what is deleted}} | no | #{{number}} |
| 6 | Feature: {{the new requirement}} | yes | #{{number}} |

## Test strategy

{{Which tests prove the refactoring kept behavior; how the new feature is tested.}}

## Options considered and rejected

- {{option}}: {{why not}}
