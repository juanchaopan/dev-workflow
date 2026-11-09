# Requirements

Numbering: REQ followed by three digits; numbers are never reused. A dropped requirement keeps its text, its status becomes "Deprecated", and it names the requirement that replaces it.

Status: Active (to be built), Implemented (already in the code, inherited from the existing system), Deprecated.
Source: user answer / AI suggestion, user default / document location / inferred from code (an unconfirmed inference becomes "inferred from code, confirmed by user" once the user confirms it).

## REQ-001 {{title}}

- Priority: {{MVP / Later}}
- Status: {{Active / Implemented / Deprecated (replaced by REQ-xxx)}}
- Source: {{source}}
- User story: As a {{role}}, I want to {{do something}}, so that {{benefit}}.
- Acceptance criteria:
  1. Given {{precondition}}, When {{action}}, Then {{result}}.
  2. Given {{precondition}}, When {{invalid action}}, Then {{how the system responds}}.
- Business rules:
  - {{rule}}
- Edge cases and failures:
  - {{situation}}: {{handling}}
- Related: {{other REQs, glossary terms, open question IDs; for implemented requirements, the code location}}
