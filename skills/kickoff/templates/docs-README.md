# Project documentation

These documents are the project's shared memory. AI reads the relevant parts before doing anything and updates them afterwards; people can read and edit them at any time.

| Location | Content | Maintained by |
|---|---|---|
| `product/vision.md` | Product vision: who it is for, what problem it solves, what success looks like, stage scope (which modules are built and which are planned for later stages), scope and constraints | Created by /kickoff, updated by /change |
| `product/requirements.md` | Requirements (REQ-xxx) with module and planned stage: user stories and acceptance criteria | Created by /kickoff or /onboard, updated by /change |
| `product/glossary.md` | Business glossary | Created by /kickoff, updated by /change |
| `product/open-questions.md` | Questions not settled yet | Updated at every stage |
| `architecture/overview.md` | Architecture: layers, components, deployment, data ownership, failure handling | Created by /architect or /onboard, updated by /architect |
| `architecture/tech-debt.md` | Tech debt and quality baseline | Created by /onboard, updated as each item is paid off |
| `adr/` | Architecture decision records, one file per significant decision | Added by /architect and /spike |
| `design/` | Design: element index, common rules, permission matrix and completeness check (`README.md`); screen definitions, prototypes and user-confirmed screenshots (`screens/`); data definitions (`data.md`); interface definitions (`interfaces.md`); complex business logic (`logic/`) | Created by /design, updated by /change through /design |
| `design/as-is/` | Evidence of what a taken-over system does: screens with real screenshots, fields as enforced on screen, server and database, actual data, interfaces and their callers, business rules, and findings (suspected bugs, contradictions, dirty data). Not a design to follow | Created by /onboard; /design and /kickoff fill in only "Used by" and "Resolution" |
| `design/refactor/` | Code structure redesigns when a set of classes, interfaces or modules must change | Added by /change |
| `roadmap.md` | Current stage plan and issue table; progress lives in the GitHub issues | Created by /roadmap, updated by /change |

## Conventions

- IDs: requirements REQ-001, architecture decisions ADR-0001, screens SCR-001, data entities ENT-001, interfaces API-001, scheduled jobs JOB-001, business logic LGC-001, all starting at 1. Evidence of a taken-over system uses CUR-SCR, CUR-ENT, CUR-API, CUR-JOB and CUR-RUL for its elements and FND for findings. IDs are never reused: an ID whose item is removed is not given to another item, and the removed item stays in git history.
- Documents hold only the latest content and the latest decision. Version history is git history; documents have no deprecated items, superseded decisions or change logs.
- Each document with a status line, and each requirement, design element and ADR entry where useful, records when it was last changed: `Last changed: <kickoff | architect | design | #<issue number>> (<YYYY-MM-DD>)`. `kickoff`, `architect` and `design` are used for work done before any issue exists.
- Development follows the design: screens follow the user-confirmed screenshots; validation, data and interfaces follow the definitions in the design. To change behavior, change the design first, then the code.
- The old system's behavior is evidence, not a rule: nothing from `design/as-is/` applies until /design has turned it into a confirmed design element.
- Documents are committed on the branch the user is working on, like code: on a `docs/` branch merged with /open-pr when no issue exists, and on the issue's branch with the implementation inside an issue.
- When documents and code disagree, find out which is right first, then fix both.
- Content inferred from code or documents and not yet confirmed by the user is marked as "inferred".
