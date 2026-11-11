# AI code review workflow

Modeled on the Claude Code team's article "How the Claude Code team does code review". The idea is to put several automatic gates between "AI finished the code" and "the code is merged and released", so people look closely only where the risk is high. The article describes a multi-person team; this is a version that works for individuals and small teams too.

It is the "development to merge" part of the whole workflow; the other parts are in the `README.md` at the plugin root.

## How to use it

Open Claude Code in any GitHub project and type `/setup-ai-review`. Claude copies the generic files into the project, fills in the project-specific ones for the actual project, lets you choose a branching strategy, and walks you through the settings on GitHub. /scaffold (new projects) and /onboard (existing projects) call it automatically.

Once set up, the daily flow is:

1. Have Claude write the code (or use `/implement <issue number>`).
2. When it is done, type `/open-pr`. Claude runs the tests, lint and architecture checks, does a simplification pass, then a local code review and security review, fixes the problems, tidies the commits, opens the PR and enables auto-merge.
3. The PR runs these checks automatically: `ci` (tests, lint, architecture checks and build of each component, plus duplicate code detection), `commit-lint` (commit message format), `ai-review` (risk tier and AI code review), `security-review` (AI security review).
4. Every comment the AI leaves on a code line is either fixed by Claude or resolved with a stated reason.
5. Look at the risk label on the PR:
   - `risk:low` (e.g. documentation only): merges automatically once every check is green.
   - `risk:medium` / `risk:high`: read the change yourself, and once you are satisfied add the `human-reviewed` label; then it merges automatically.
6. Any new commit afterwards voids `human-reviewed`, and you need to look again.

Away from your computer, you can comment `@claude` with a request on an issue or PR on the GitHub website or your phone (e.g. "@claude implement this issue", "@claude address the review comments"), and Claude handles it in the cloud; the changes go through every check as usual. This suits small, clearly described changes; anything that needs back-and-forth is better done with /change in Claude Code.

## Branching strategy

Chosen at setup and written into the project's CLAUDE.md; `/open-pr`, `/implement` and `/release` follow it.

| | GitHub Flow | Git Flow |
|---|---|---|
| Default branch | main | develop |
| Daily development | `feature/`, `fix/`, `refactor/` from main, PRs back into main | `feature/`, `fix/`, `refactor/` from develop, PRs back into develop |
| Release | A version tag on main | `release/x.y.z` from develop, PR into main, tag, merge back into develop |
| Urgent production fix | Same as daily development | `hotfix/x.y.z` from main, PR into main, merge back into develop |
| Fits | One person, continuous releases | Clear version numbers, a stable release line |

The code in a release PR (`release/*` → main) was reviewed when it went into develop, so it gets no further AI review, but it always counts as high risk: merging is releasing, and you confirm it. PRs merging main back into develop count as low risk and merge automatically.

Branches stay on GitHub after they merge, under both strategies: feature, fix, refactor, release, hotfix and spike branches are never deleted on the remote. The workflow removes only local branches and worktrees once their work is pushed.

## Keeping code from turning into patchwork

A common weakness of AI-written code is growing bloat: more and more ifs and parameters added to old functions, dead code left behind, comments that read like change logs. There are defenses at four points:

| Point | How |
|---|---|
| While writing | "How to write code" in CLAUDE.md: reads as if written in one go; no change-log comments; refactor first, then add the feature |
| After writing | Every /implement step is "test → implement → refactor"; /open-pr runs a `simplify` pass first |
| In review | "Patchwork and bloat" in REVIEW.md: the AI reviewer looks for exactly these problems |
| Machine checks | Each stack's complexity and function length limits, jscpd duplicate detection, architecture checks |

## What each file does

### Generic files: the same in every project, no changes needed

| File | Purpose |
|---|---|
| `AGENTS.md` | Entry point for other AI tools such as Codex, Cursor and Copilot, pointing to CLAUDE.md and the standards |
| `.github/pull_request_template.md` | PR template that always includes Testing, Risk and How to revert |
| `.github/ISSUE_TEMPLATE/bug_report.md` | Bug report template. Fixed bugs can become review cases |
| `.github/workflows/ai-review.yml` | Risk tier and AI code review on every PR; medium and high risk need your label to pass |
| `.github/workflows/security-review.yml` | AI security review on every PR |
| `.github/workflows/commits.yml` | Checks the message of every commit in the PR |
| `.github/scripts/risk-classify.mjs` | The risk tier script `ai-review` calls |
| `.github/scripts/check-commit-message.mjs` | The commit message check shared by the local hook and CI |
| `.githooks/commit-msg` | Checks commit messages locally. Takes effect after running `git config core.hooksPath .githooks` once |
| `.claude/hooks/format.mjs` | Runs formatting and lint automatically after Claude changes each file |
| `.claude/commands/open-pr.md` | The `/open-pr` command: self-check, simplify, local review, tidy commits, then open the PR |
| `evals/run-review-evals.mjs` | Scores the AI reviewer |

### Project-specific files: fixed structure, content filled in per project

| File | Content |
|---|---|
| `CLAUDE.md` | Project summary, document language, components, **the check commands Claude can run itself**, code standards, how to write code, goals and non-goals, branch and commit rules. Every review reads it, so keep it short |
| `REVIEW.md` | Tells the AI reviewer what counts as "bad" in this project, what to focus on, what not to report and which paths to skip |
| `.github/workflows/ci.yml` | One job per component, plus duplicate code detection and a `ci` summary job |
| `.github/workflows/claude.yml` | `@claude` cloud collaboration: the environment and the commands it may run |
| `.github/dependabot.yml` | Weekly automatic dependency updates for each component |
| `.jscpd.json` | Threshold and ignored paths of duplicate code detection |
| `.claude/hooks/format.config.json` | For each component directory, which tool formats and lints which files (format below) |
| `.github/risk-rules.txt` | Which paths are high risk and which are low risk |

### Not in the code: settings on the GitHub website

| Setting | Purpose |
|---|---|
| Claude GitHub App | Lets Claude comment on PRs and respond to `@claude` |
| Secrets | Holds `CLAUDE_CODE_OAUTH_TOKEN` (subscribers) or `ANTHROPIC_API_KEY` (API users) |
| Auto-merge on, "Automatically delete head branches" off | Merges automatically once checks pass; merged branches stay on GitHub |
| Branch rules (ruleset) | The default branch and main change only through PRs; merging requires `ci`, `risk-gate` and `commit-lint` to pass and every review thread to be resolved |

This skill's `github-settings/ruleset.json` is the branch rule configuration `/setup-ai-review` uses to create the rules. Private repositories on GitHub Free cannot use branch rules: make the repository public or upgrade to GitHub Pro.

### Built up over time: review cases

Each file in `evals/review-cases/` records a real bug: which change introduced it and on which line. After changing REVIEW.md, run `node evals/run-review-evals.mjs` to see whether the AI reviewer still catches those bugs. If the score did not improve, revert the change. See `evals/README.md`.

## PRs from outside contributors and Dependabot

For PRs from forks and Dependabot's dependency update PRs, GitHub withholds secrets for security reasons, so the AI review and security review skip them. CI, commit message checks and risk tiers still run, and medium and high risk still need your `human-reviewed` label. When you want an AI review, comment `@claude please review this PR` on the PR (only people with write access can trigger it).

Contributors do not need Claude or this plugin: CI and the branch rules are what enforce the standard, so whatever tool they use, merged code meets the same bar. With Claude Code they read the repository's CLAUDE.md and `.claude/rules/` automatically; with other AI tools they start from `AGENTS.md`.

## How the article's practices map here

| Practice in the article | How it is done here |
|---|---|
| AI verifies first: runs tests, build and lint, and shows the results | "Self-check commands" in CLAUDE.md, step 2 of `/open-pr`, the format hook |
| Review the diff once more with a fresh context | simplify, code-review and security-review in `/open-pr` |
| An AI review on every PR, against the whole repository and the PR's intent | claude-review in `ai-review.yml`, which also checks the issue's acceptance criteria, architecture decisions, layering standards and the design |
| Findings labeled Important / Nit / Pre-existing, each one handled | The labels the review prompt requires, plus the branch rule "every review thread resolved" |
| Security review, no merge while it finds problems | `security-review.yml`, plus the same branch rule |
| Required CI | `ci.yml` and `commits.yml`, plus the required checks in the branch rules |
| Risk comes from the change, not the author | `risk-rules.txt` assigns tiers by path, read from the target branch |
| Sensitive paths and CI workflows always get a human | `.github/**`, lint and architecture check configuration and similar paths are under `[high]` by default |
| A machine's approval is not a human's | Only the `human-reviewed` label you add yourself counts; the AI reviewer cannot add labels |
| Approval is valid for one commit | New commits void and remove `human-reviewed` |
| Limit review rounds, later rounds look only at new changes, no repeats | At most 3 rounds; later rounds review only new commits; existing comments are read first |
| Higher risk, deeper review | Review depth follows the `risk:*` tier |
| Test the reviewer with past incidents | `evals/` |
| Fix recurring review findings at the source | Written into REVIEW.md, CLAUDE.md or lint rules |
| Feature flags, gradual rollout, one-step rollback | The workflow conventions in CLAUDE.md, How to revert in the PR template, `/release` and the deployment pipeline |

These multi-person practices from the article are not copied here: two approvals, trusted author lists, merge queues (the workflows already support `merge_group`; switch it on in GitHub when needed), several AIs voting to filter false positives, nightly scans of old code (if wanted, run `/code-review` on a schedule with `/schedule`).

## format.config.json format

```json
{
  "rules": [
    { "dir": "apps/web", "extensions": [".ts", ".html", ".scss"], "format": "npx prettier --write {file}", "lint": "npx eslint {file}" },
    { "dir": "apps/worker", "extensions": [".py"], "format": "uv run ruff format {file}", "lint": "uv run ruff check {file}" },
    { "dir": "apps/admin", "extensions": [".cs"], "format": "dotnet format whitespace --folder --include {relfile}" }
  ]
}
```

- `dir`: the directory the rule covers, and where its commands run. Omitted means the whole repository. When several rules match, the one with the deepest directory wins.
- `{file}` becomes the absolute path of the file just changed, `{relfile}` its path relative to `dir`.
- A failed format does not block; a lint failure is handed back to Claude to keep fixing.

## Commit message format

```
<type>(<scope>): <description> (#<issue number>)

<optional body explaining why>
```

Types: `feat` feature, `fix` bug fix, `docs` documentation, `style` formatting, `refactor` refactoring, `perf` performance, `test` tests, `build` build and dependencies, `ci` CI configuration, `chore` miscellaneous, `revert` revert. Breaking changes add `!` after the type, e.g. `feat(api)!: remove the old endpoint`. `/release` derives the next version from these types.

## Cost

Each PR runs Claude twice per round, once for the code review and once for the security review; every `@claude` also runs it once. A subscription token uses the subscription's allowance; an API key is billed by usage. Draft PRs trigger no review.

An alternative is Anthropic's open-source security review action, `anthropics/claude-code-security-review`. It supports only API keys and filters false positives more finely. To switch, replace `security-review.yml` following its instructions.

## Things to watch

- When a PR changes files under `.github/workflows/`, the AI review on that PR may fail: `claude-code-action` only runs when the workflow file is identical to the default branch's version. These PRs are high risk anyway and need you to review them before merging.
- When you must push directly in an emergency, disable the rules temporarily under Settings → Rules on GitHub, and switch them back on afterwards.
