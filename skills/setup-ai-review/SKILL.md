---
name: setup-ai-review
description: Sets up a GitHub repository with the complete "AI writes the code, AI reviews it first, people check by risk" review workflow (modeled on the Claude Code team's code review practice, sized for individuals and small teams). Copies the generic templates, fills in CLAUDE.md, AGENTS.md, REVIEW.md, CI (with duplicate code detection), the format hook, risk rules, automatic dependency updates and @claude cloud collaboration for the actual project, configures the branching strategy (GitHub Flow or Git Flow) and commit message checks, then walks the user through the secrets and branch rules on GitHub. Use when the user says "set up the review workflow", "add code review to the project", "setup ai review" or "review AI-written code"; /scaffold and /onboard also call it.
---

# Setting up the AI code review workflow

This skill's directory (the Base directory shown when the skill loads) contains:

- `template/`: files copied into the project. Generic files are used as they are; project-specific files have `{{...}}` placeholders or "Project-specific" sections to fill in for the project.
- `install.mjs`: copies `template/` into the target repository, skipping every file that already exists there.
- `github-settings/ruleset.json`: the rules for protected branches, created through the GitHub API.
- `README.md`: the explanation for the user of what each file does. Use it when the user asks "what is this" or "why like this".

Follow the steps in order, telling the user in a sentence or two what each step did. Talk to the user in their language.

## 1. Confirm the target repository

- Run `git rev-parse --show-toplevel`. When the current directory is not a git repository, ask the user which project to set up.
- Run `gh repo view --json nameWithOwner,defaultBranchRef,visibility,isPrivate`. Without a GitHub remote, tell the user the repository must be created on GitHub and pushed first, and ask whether to do that now; do not create it on your own.
- When the working tree has uncommitted changes, ask the user how to handle them first.

## 2. Copy the templates

Run `node "<this skill's directory>/install.mjs" "<repository root>"` and note `copied` and `skipped` in its output.

## 3. Learn the project

Read the README, the dependency manifests (package.json, pyproject.toml, pom.xml, build.gradle(.kts), *.csproj, go.mod and so on), the existing CI configuration and the directory structure, and work out the components, each component's language, framework and package manager, and the commands for formatting, lint, architecture checks, type checking, tests and builds. For projects created by /scaffold or given its standards, take the commands and CI steps straight from each stack's `stack.md` in the scaffold standards library (`scaffold/stacks/` next to this skill).

When the project's stack is in the library but the standards are not installed yet, tell the user /scaffold can add them to the existing project; when the project has no `docs/`, tell the user /onboard can document the current state.

## 4. Choose the branching strategy

Let the user choose with AskUserQuestion (skip it when CLAUDE.md already says):

- **GitHub Flow** (recommended for one developer): `feature/`, `fix/` and `refactor/` branches from main, PRs back into main; a release is a version tag on main.
- **Git Flow**: develop is the default branch; `feature/`, `fix/` and `refactor/` branch from develop and return to it by PR; a release branches `release/<version>` from develop, merges into main by PR and is tagged, then main is merged back into develop; urgent production problems branch `hotfix/<version>` from main, merge into main by PR, and are merged back into develop too.

Write the chosen strategy's description into the "Branches and commits" section of CLAUDE.md.

## 5. Fill in the project-specific files

Rewrite each file as a whole and remove every `{{...}}` placeholder. Ask the user for what you cannot infer, never make it up; delete entries that do not apply.

| File | How to fill it |
|---|---|
| `CLAUDE.md` | Project summary, the language for project documents (ask the user; default: the language they talk to you in), the component table, each component's self-check commands (the lint column includes the architecture check), code standards, goals and non-goals, branches and commits. Run the self-check commands locally once to confirm they work. Heavy checks: the commands, how to stop what they start, and whether Docker Desktop is quit afterwards (ask the user; recommend quitting it when it runs only for these checks); "none" removes the cleanup line too. Environments: the staging URL and how to see which commit it runs, from the deployment in `docs/architecture/overview.md` or the deploy workflow; "none" without staging. Keep "How to write code" as it is. Keep it short and link to docs/ for longer content |
| `AGENTS.md` | Usually kept as it is; adjust when the project's documents live somewhere other than the template says |
| `REVIEW.md` | Infer from the project type what counts as "bad", what to focus on and which paths to skip, and confirm with the user. Review comments use the project's document language. Keep "Patchwork and bloat" as it is |
| `.github/workflows/ci.yml` | Replace the "Project-specific" section with one job per component (from the CI steps in `stack.md`) and add those job names to the `needs` of the `ci` summary job. Keep the `duplication` job. Branch rules recognize the checks by the name `ci` |
| `.github/workflows/claude.yml` | Replace the "Project-specific" section with the tool setup steps the self-check commands need (the same as in ci.yml); replace the placeholder in `--allowedTools` with Bash permissions for the self-check commands, e.g. `Bash(npm run lint:*),Bash(npm test:*),Bash(./mvnw:*)` |
| `.github/dependabot.yml` | Replace the "Project-specific" section with one entry per component; `package-ecosystem` follows the package manager (npm, maven, gradle, uv, pip, nuget) and `directory` is the component directory |
| `.claude/hooks/format.config.json` | Rules only for formatting and lint tools that are already installed; run each command once first to confirm it exists. Each rule sets `dir` to its component directory. The format is in the README |
| `.github/risk-rules.txt` | Adjust `[high]` and `[low]` to the project's directory structure: authentication, payments, data migrations, release and install scripts, CI configuration and lint and architecture check configuration go under `[high]`; pure documentation under `[low]` |
| `.jscpd.json` | Keep as it is for new projects. For existing projects, run `npx jscpd .` at the repository root to measure today's duplication rate, set `threshold` to it rounded up, record it in `docs/architecture/tech-debt.md`, and lower it over time |

Files in `skipped` already existed in the project: read the original, find what the template has and the original lacks, tell the user how you plan to merge, and rewrite the file as a whole once they agree. Keep the existing content of an existing `CLAUDE.md` in particular.

## 6. Verify locally

- `node --check` on `.claude/hooks/format.mjs`, `.claude/hooks/enable-git-hooks.mjs`, `.github/scripts/risk-classify.mjs`, `.github/scripts/check-commit-message.mjs` and `evals/run-review-evals.mjs`.
- Try the format hook on a real file of the project: `echo '{"tool_input":{"file_path":"<absolute path of the file>"}}' | node .claude/hooks/format.mjs`; the exit code should be 0.
- Try the risk rules on a few paths: `node .github/scripts/risk-classify.mjs --dry-run README.md <a source file> .github/workflows/ci.yml` and confirm the tiers are as expected.
- Enable the commit message hook for this clone with `node .claude/hooks/enable-git-hooks.mjs`, the script Claude Code runs at the start of every session in this project, so new clones, other machines and cloud sessions get it too; `git config core.hooksPath` should then print `.githooks`. When running it is not permitted, ask the user to run `! git config core.hooksPath .githooks`. Run `git update-index --chmod=+x .githooks/commit-msg` so clones on macOS and Linux can execute the hook. Try an invalid message: `echo "random change" > "$TMPDIR/msg" && node .github/scripts/check-commit-message.mjs --file "$TMPDIR/msg"` should report an error, and `node .github/scripts/check-commit-message.mjs --range origin/<default branch>..HEAD` (what `/open-pr` and /implement run before every push) should pass for the commits of step 7 before they are pushed.
- Run `npx jscpd .` at the repository root; it should pass.
- Run every self-check command in CLAUDE.md.

## 7. Commit and push

With the user's approval, split the files into a few Conventional Commits (e.g. `ci: add AI review, security review and duplicate code detection`, `chore: add commit message checks and automatic dependency updates`, `docs: add CLAUDE.md, AGENTS.md and REVIEW.md`) and push them straight to the current default branch. Branch rules are not on yet, so pushing directly works; besides, `claude-code-action` only runs when the workflow file already exists on the default branch with the same content.

With Git Flow: confirm these commits are on main, branch develop from main and push it, then `gh repo edit --default-branch develop`.

## 8. GitHub settings

These change the user's GitHub account or repository. Explain each one and wait for approval before doing it. For commands the user must type themselves, ask them to run `! <command>` at the prompt.

1. **Install the Claude GitHub App**: open https://github.com/apps/claude and install it on this repository.
2. **Store the secret**, one of:
   - With a Claude Pro or Max subscription: the user runs `! claude setup-token` for a token, then `! gh secret set CLAUDE_CODE_OAUTH_TOKEN` and pastes it.
   - With API billing: the user runs `! gh secret set ANTHROPIC_API_KEY` and pastes the API key.
3. **Repository options**: `gh repo edit --enable-auto-merge --delete-branch-on-merge=false`. With auto-merge on, GitHub merges a PR once every check passes. Merged branches stay on GitHub, so every feature, fix, refactor, release, hotfix and spike branch can still be looked up later; the workflow removes only local branches and worktrees.
4. **Issue type labels**: `type:feature` (`1d76db`), `type:bug` (`d73a4a`), `type:refactor` (`fbca04`), `type:chore` (`c5def5`), `type:spike` (`d4c5f9`), created with `gh label create <name> --color <color> --force`. Risk labels (`risk:*`, `human-reviewed`) are created automatically on the first `ai-review` run.
5. **Branch rules**: run `gh api repos/<owner>/<repo>/rulesets --method POST --input "<this skill's directory>/github-settings/ruleset.json"`. The rules protect the default branch and main: every change goes through a PR, and merging requires `ci`, `risk-gate` and `commit-lint` to pass and every review thread to be resolved. Private repositories on GitHub Free cannot use branch rules and the API returns an error: tell the user they can make the repository public or upgrade to GitHub Pro; until then the workflow relies on discipline.
6. **Dependabot**: `dependabot.yml` takes effect once pushed. For Dependabot security updates, enable them under Settings → Code security.

## 9. Trial run and report

Suggest a trial with a small change: edit a document, run `/open-pr`, and check on the PR page that `ci`, `commits`, `ai-review` and `security-review` all run; then comment `@claude hello` on an issue to try the cloud collaboration. Whether to run it is the user's call.

Finally report: which files were installed and what was filled in, which branching strategy was chosen, which GitHub settings are done and which the user still has to do, and that README.md has the full explanation.
