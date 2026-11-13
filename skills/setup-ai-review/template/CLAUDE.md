# {{project name}}

{{One sentence on what this project is and who it is for.}}

## Language

Project documents (docs/), review comments and issue text are written in {{language, e.g. English}}. Code identifiers and commit message types follow the conventions below.

## Components

| Component | Directory | Stack | Responsibility |
|---|---|---|---|
| {{component}} | `{{directory}}` | {{language, framework and version}} | {{one-sentence responsibility}} |

## Self-check commands

After any change, run the commands below for every component you changed and show their real output in your reply. Keep fixing until everything passes instead of just saying "done". Commands run in the component directory; "—" means none.

| Component | Format | Lint and architecture | Type check | Tests | Build |
|---|---|---|---|---|---|
| {{component}} | `{{command}}` | `{{command}}` | `{{command}}` | `{{command}}` | `{{command}}` |

The whole repository also has duplicate code detection: `npx jscpd .` (at the repository root).

Heavy checks, which use a lot of memory or a container runtime: {{each command with what it holds — fixed ports, output directories, whether it uses containers, roughly how much memory; "none"}}. Checks that hold nothing in common may run at the same time when the machine can carry them.

After a heavy check, whether it passed or failed, nothing it started keeps running: stop it with {{e.g. `docker compose -f infra/docker-compose.e2e.yml down`; containers run with `docker run --rm` remove themselves}}. Docker Desktop after heavy checks: {{"quit it with `docker desktop stop` when the check started it" or "leave it running"}}.

## Code standards

- Each stack's standards are in `.claude/rules/` and load automatically when you change files in the matching directories. Their layering rules are enforced by the architecture checks: when a check fails, change the structure of the code, not the rules; when a rule really must change, ask first.
- {{project-specific conventions}}
- New logic comes with tests. Tests must fail when the code is wrong and must not repeat the implementation's mistakes.
- Never commit secrets, tokens or personal data; read them from environment variables or a secret store.

## How to write code

- Changed code reads as if written in one go. Comments explain what the code does now and why it is designed that way; no change-log comments such as "changed to...", "added...", "fixed...", "previously..."; history belongs in commit messages.
- No dead code, commented-out code, unused parameters or branches, and no code kept for compatibility with an old way of doing things unless a caller really still uses it.
- When a new requirement does not fit the current structure, restructure first, then add the feature: one refactoring commit that keeps behavior (tests stay green), then the feature commit. Do not keep adding ifs and parameters to old functions.
- Consider extracting logic the second time it appears; extract it the third time.
- Split functions and files as they grow long or complex. Lint checks complexity and length limits; jscpd checks duplication.
- When a change would broadly affect existing classes, interfaces or module boundaries, stop and assess the design impact with /change instead of redesigning while coding.

## Goals and non-goals

- Goals: {{what the project must achieve at this stage}}
- Non-goals: {{what is explicitly not done, to keep the scope from growing}}

## Branches and commits

- Branching strategy: {{description of the chosen strategy}}
- Branch names: {{naming rules, e.g. feature/<issue>-<summary>, fix/<issue>-<summary>, refactor/<issue>-<summary>, docs/<summary>, chore/<summary>, spike/<summary>}}
- Commit messages follow Conventional Commits: `<type>(<scope>): <description> (#<issue>)`, first line at most 100 characters, e.g. `feat(auth): support e-mail sign-in (#12)`.
- After every commit and before every push, run `node .github/scripts/check-commit-message.mjs --range origin/<target branch>..HEAD` and reword what it reports while the commits are still local. CI's `commit-lint` checks every commit of the PR with the same rules, and a commit already pushed cannot be fixed by adding another one.
- `.githooks/commit-msg` also checks each message as it is committed, once the clone's `core.hooksPath` is `.githooks`. Claude Code sets it at session start (`.claude/settings.json`); in other clones run `git config core.hooksPath .githooks` once after cloning.
- One commit does one thing, every commit passes the self-check commands on its own, and nothing unrelated is mixed in.
- Merge method: {{e.g. merge commit, keeping every small commit}}. PRs have auto-merge enabled and GitHub merges them once every check passes.

## Environments

- Staging: {{URL, and how to see which commit it runs, e.g. `curl <url>/version` or the `staging` deployments on GitHub; "none"}}.
- A change is done when its PR has merged, CI on {{integration branch}} has passed for the merge commit, and staging runs it.

## Workflow

- Never commit directly to protected branches; every change merges through a PR.
- Open PRs with `/open-pr`: it runs the self-check commands, a local simplification pass, code-review and security-review first, then fills in the PR template.
- Make new features switchable where possible (a flag or setting), so they can be turned off without rolling back code.
- When a change touches paths under `[high]` in `.github/risk-rules.txt`, give the reason in the Risk section of the PR.
- Behavior users can see — screens, fields, validation, messages, interfaces, data structures, business rules — follows `docs/design/`, and screens follow the user-confirmed screenshots. To change such behavior, change the design with /change first, then the code.
- When requirement, design or architecture documents are not enough or disagree with the code during implementation, stop and ask instead of deciding yourself.
- When an approach is uncertain or risky, run a throwaway /spike first, record the conclusion in an ADR, then implement it properly.

## Documents

- Review standards: `REVIEW.md`
- Entry point for other AI tools: `AGENTS.md`
- {{documentation index, e.g. docs/README.md: requirements, architecture, design, decision records, roadmap}}
