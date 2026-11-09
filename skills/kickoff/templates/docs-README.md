# Project documentation

These documents are the project's shared memory. AI reads the relevant parts before doing anything and updates them afterwards; people can read and edit them at any time.

| Location | Content | Maintained by |
|---|---|---|
| `product/vision.md` | Product vision: who it is for, what problem it solves, what success looks like, scope and constraints | Created by /kickoff, updated by /change |
| `product/requirements.md` | Requirements (REQ-xxx): user stories and acceptance criteria | Created by /kickoff or /onboard, updated by /change |
| `product/glossary.md` | Business glossary | Created by /kickoff, updated by /change |
| `product/open-questions.md` | Questions not settled yet | Updated at every stage |
| `architecture/overview.md` | Architecture: layers, components, deployment, data ownership, failure handling | Created by /architect or /onboard, updated by /architect |
| `architecture/tech-debt.md` | Tech debt and quality baseline | Created by /onboard, updated as each item is paid off |
| `adr/` | Architecture decision records, one file per significant decision | Added by /architect and /spike |
| `design/` | Design: element index, common rules, permission matrix and completeness check (`README.md`); screen definitions, prototypes and user-confirmed screenshots (`screens/`); data definitions (`data.md`); interface definitions (`interfaces.md`); complex business logic (`logic/`) | Created by /design, updated by /change through /design |
| `design/refactor/` | Code structure redesigns when a set of classes, interfaces or modules must change | Added by /change |
| `roadmap.md` | Milestones and issue list; progress lives in the GitHub issues | Created by /roadmap, updated by /change |
| `changes/` | Records of larger changes: what changed, why, which documents and code were affected | Added by /change |

## Conventions

- IDs: requirements REQ-001, architecture decisions ADR-0001, screens SCR-001, data entities ENT-001, interfaces API-001, scheduled jobs JOB-001, business logic LGC-001, all starting at 1. IDs are never reused: a dropped item stays, marked "Deprecated", naming what replaces it.
- Development follows the design: screens follow the user-confirmed screenshots; validation, data and interfaces follow the definitions in the design. To change behavior, change the design first, then the code.
- Documents change through pull requests, like code.
- When documents and code disagree, find out which is right first, then fix both.
- Content inferred from code or documents and not yet confirmed by the user is marked as "inferred".
