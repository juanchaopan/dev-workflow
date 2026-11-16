# Requirements

Numbering: REQ followed by three digits; numbers are never reused. A requirement that is dropped is removed from this file, and its number is not given to another requirement.

Status: Active (to be built), Implemented (already in the code, inherited from the existing system).
Stage: the stage the requirement is planned for, e.g. "Stage 1: foundation module" for this stage, or "Later (set by a /change issue)".
Source: user answer / AI suggestion, user default / document location / inferred from code, confirmed by user / inferred from code (not yet confirmed).
Last changed: kickoff (YYYY-MM-DD), or #issue number (YYYY-MM-DD) once an issue changes the requirement.

## REQ-001 {{title}}

- Module: {{module name}}
- Stage: {{Stage 1: module name / Later (set by a /change issue)}}
- Priority: {{MVP / Later}}
- Status: {{Active / Implemented}}
- Source: {{source}}
- Last changed: kickoff ({{YYYY-MM-DD}})
- User story: As a {{role}}, I want to {{do something}}, so that {{benefit}}.
- Acceptance criteria:
  1. Given {{precondition}}, When {{action}}, Then {{result}}.
  2. Given {{precondition}}, When {{invalid action}}, Then {{how the system responds}}.
- Business rules:
  - {{rule}}
- Edge cases and failures:
  - {{situation}}: {{handling}}
- Related: {{other REQs, glossary terms, open question IDs; for implemented requirements, the code location}}
