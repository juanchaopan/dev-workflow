# Platform concept mapping

How each concept dev-workflow relies on maps to GitHub, Azure DevOps, GitLab, Bitbucket Cloud and Gitea/Forgejo (including Codeberg), with the commands and the fallbacks. The skills name the concept; the agent looks up the row for the platform the user chose. Commands are examples for that platform; check them with the CLI's `--help` before relying on a flag.

Research date: 2026-11-17. Some facts were verified on 2026-11-19; they are named in the sources.

Legend:

- **(U)**: not confirmed against official documentation. It comes from secondary sources or prior knowledge, so verify it (for example with the CLI's `--help` or the platform docs) before a skill relies on it.
- **Tier** notes name the cheapest plan that has the feature, where that matters.
- "none" means no built-in feature was found. The fallback is in section 9.

Scope of each column:

- **GitHub**: github.com.
- **Azure DevOps**: Azure DevOps Services (Repos, Boards, Pipelines).
- **GitLab**: gitlab.com and self-managed.
- **Bitbucket Cloud**: Bitbucket plus Jira. Atlassian removed Bitbucket's own issue tracker and wiki on 2026-08-20, including their REST API.
- **Gitea / Forgejo**: Gitea and Forgejo instances. Codeberg runs Forgejo.

Placeholders used throughout: `N` is the issue or work item number, `P` the PR number, `B` the branch, `O/R` the owner and repository, `WS/REPO` the Bitbucket workspace and repository, `E` an environment, `SHA` the head commit of the PR.

## 1. Concept mapping table

### Planning: issues, labels, dependencies

| Concept | GitHub | Azure DevOps | GitLab | Bitbucket Cloud | Gitea / Forgejo / Codeberg |
|---|---|---|---|---|---|
| Repository | Repository owned by a user or an organization | Git repository inside a project (organization > project > repos) | Project inside a group or subgroup | Repository in a workspace, grouped by projects | Repository owned by a user or an organization |
| Issue / work item | Issue | Work item (Azure Boards) | Issue | Jira work item | Issue |
| Issue type and size | Labels `type:<type>` and `size:<size>` | Every issue is created as the process's general work item type (Basic: Issue; Agile: User Story; Scrum: Product Backlog Item; CMMI: Requirement). Type and size are tags `type:<type>` and `size:<size>`. | Labels `type:<type>` and `size:<size>` | Labels `type:<type>` and `size:<size>` on the Jira work item. Jira needs a work type at creation; use one general type for every issue (U which one the project offers). | Labels `type:<type>` and `size:<size>` |
| Labels / tags | Labels per repository. Creating an issue with a label that does not exist fails, so the labels must exist first. | Tags (`System.Tags`) on work items, created when first used; labels on PRs | Labels (project or group) | Jira labels, created when first used. Bitbucket PRs have no labels (U). | Labels (repository and organization) |
| Risk and approval labels | PR labels `risk:low`, `risk:medium`, `risk:high`, `human-reviewed` | PR labels `risk:*`. Human approval is a required reviewer group (section 1, human-approval rows). | MR labels `risk:*`, `human-reviewed` | No PR labels: the risk level goes in the PR description, and human approval is a reviewer-group approval | PR labels `risk:*`, `human-reviewed` |
| Issue reference format | `#12` | `#12` (work item ID) | `#12` | Jira key `KEY-12` | `#12` |
| Dependencies / "blocked by" | Issue dependencies: blocked by and blocking (UI Relationships panel, REST `/issues/{n}/dependencies/blocked_by`, `gh` 2.94 or later). Informational only: a "Blocked" icon, with no block on closing or merging. | Predecessor/Successor link type (`System.LinkTypes.Dependency`). Informational only. | `relates_to` links in all tiers. `blocks` / `is_blocked_by` need Premium; closing a blocked item shows a warning. | Jira issue link "blocks / is blocked by". Informational unless a Jira workflow condition or automation enforces it. | Issue dependencies (blocks / depends on), switched on per repository. Cross-repository links need a server setting. Closing a blocked issue, or merging a blocked PR, is refused (U). |

The issue types are `feature`, `fix`, `refactor`, `maintenance`, `ops` and `spike`; the sizes are `S`, `M`, `L` and `XL`. Native issue types are not used on any platform. /kickoff creates the `type:*`, `size:*`, `risk:*` and `human-reviewed` labels once the remote repository exists, on the platforms where labels must be created before use. The project's `AGENTS.md` records the issue reference format.

### Pull requests, protection and merging

| Concept | GitHub | Azure DevOps | GitLab | Bitbucket Cloud | Gitea / Forgejo / Codeberg |
|---|---|---|---|---|---|
| Pull / merge request | Pull request | Pull request | Merge request | Pull request | Pull request |
| Link PR so it closes the issue | `Closes #12` / `Fixes` / `Resolves` in the PR body or a commit. The issue closes when the PR merges into the default branch. | Link work items to the PR (`--work-items`) and complete them on merge (`--transition-work-items`). A "Check for linked work items" policy can require the link. | `Closes #12` in the MR description or a commit, on merge into the default branch. The pattern is configurable. | The Jira key in the branch name, commit or PR title links the work. A Jira automation or workflow trigger moves it to Done on merge. | `closes` / `fixes` / `resolves #N` in the PR body or commits (U for the exact keyword list) |
| Required status checks | Ruleset rule or branch protection "required status checks" | Build validation policy (runs a pipeline; required or optional; can expire). Status check policy for external statuses. | "Pipelines must succeed" (all tiers). External status checks need Ultimate. | Merge check "Minimum successful builds". It counts build statuses on the latest commit, from Pipelines or from external CI through the build status API. | Branch protection "Enable status check", with glob patterns for the check names |
| Required check skipped by a path filter | A workflow skipped by `paths:` never reports, so its required check stays pending and blocks the merge. Decide inside the workflow instead: a job skipped by `if:` reports success. | A build validation policy has its own path filter; when no changed file matches, the policy does not apply and does not block (U). | Jobs left out by `rules: changes:` are not in the pipeline, and the pipeline still succeeds. If no job remains, no pipeline is created and "Pipelines must succeed" blocks the merge unless skipped pipelines count as successful (U). | A step or pipeline skipped by `condition: changesets:` posts no build status, which lowers the count of successful builds (U). | Same behaviour as GitHub Actions: a workflow skipped by `paths:` leaves a required status missing (U). Decide inside the job. |
| Branch protection mechanism | Rulesets (branch and tag; can be org-wide) or classic branch protection. Private repos need Pro or Team. | Branch policies per branch or pattern (cross-repo at project level), plus branch security permissions | Protected branches (who may push and merge), all tiers | Branch restrictions (write access, merge only via PR, no force push or delete) plus merge checks. Only Premium enforces merge checks; other plans only show a warning. | Branch protection rules with glob patterns: push and merge allowlists, approvals, blocking on rejected reviews or outdated branches, dismissing stale approvals, protected file patterns (U for the full list) |
| Branch up to date before merge | Branch rule "Require branches to be up to date before merging" | Build validation that expires immediately when the target branch updates | Fast-forward merge method; merging `main` into the branch also satisfies it | (U); otherwise the agent checks | "Block merge if pull request is outdated" |
| Review threads must be resolved | Ruleset `required_review_thread_resolution` ("Require conversation resolution before merging") | "Check for comment resolution" policy (required or optional) | "All threads must be resolved" (all tiers) | None. The closest check is "No unresolved pull request tasks" (enforced only on Premium). | None found |
| Required approvals | Required approving review count, code owner review, approval of the most recent push, dismissing stale approvals | "Require a minimum number of reviewers" (self-approval on or off, reset votes on new pushes). "Automatically included reviewers" adds required groups or path owners. | Approval rules with a required count need Premium. On Free, approvals are optional. | "Minimum number of approvals", "Minimum approvals from default reviewers", "No changes requested". Resetting approvals when the source changes needs Premium. | Required approval count, with an optional approver allowlist |
| Human-approval mechanism | A required status check from a workflow on `pull_request` `labeled` / `unlabeled` that fails without the `human-reviewed` label | A required reviewer group of humans, with votes reset on new pushes | A pipeline job that fails without the `human-reviewed` label (`$CI_MERGE_REQUEST_LABELS`), with "Pipelines must succeed". Adding a label starts no pipeline, and a job sees the labels from the moment its pipeline was created, so after the label is added the agent creates a new merge request pipeline (`POST /projects/:id/merge_requests/:iid/pipelines`); it does not retry the old job. | An approval from a designated human reviewer group (a default reviewers check) | A status-check workflow on label events that fails without the `human-reviewed` label |
| Approval removed on a new commit | A workflow on `pull_request` `synchronize` with `permissions: pull-requests: write` removes `human-reviewed` | Votes reset on new pushes (policy option) | A pipeline job removes the label through the merge request API. The CI job token cannot edit merge requests; a project access token can, but on gitlab.com it needs Premium or Ultimate (any license on self-managed). On gitlab.com Free use a personal access token stored as a masked CI/CD variable. | Resetting approvals on change needs Premium. Otherwise the agent checks that the approval is newer than the last commit. | A workflow on `pull_request` `synchronize` with a token that can edit labels (U whether the built-in workflow token can) |
| Merge methods, and which can be enforced | Merge commit, squash and rebase are each enabled in repo settings. A ruleset "allowed merge methods" narrows them per branch; "require linear history" is also available. Repo settings are the outer limit. | Basic merge (no fast-forward), squash, rebase and fast-forward, rebase with merge commit (semi-linear). The "Limit merge types" policy enforces the choice per branch. | One method per project: merge commit, merge commit with semi-linear history, or fast-forward. Squash is set separately: do not allow, allow, encourage or require. dev-workflow uses fast-forward with squash required, so `main` gets no merge commits. | Merge commit, squash, fast-forward, squash (fast-forward only), rebase + merge, rebase + fast-forward. The allowed list and the default are set per repo or project. | Merge, rebase, rebase-merge (no fast-forward), squash, fast-forward only, manually merged. Each is enabled per repo, with a default. |

dev-workflow merges with squash. The agent brings an issue branch up to date by merging `main` into it, never by rebasing. Whether remote issue branches are kept after merging is decided in architect step 13, so no merge command here deletes a branch.

### CI, environments and secrets

| Concept | GitHub | Azure DevOps | GitLab | Bitbucket Cloud | Gitea / Forgejo / Codeberg |
|---|---|---|---|---|---|
| CI system and file location | GitHub Actions, `.github/workflows/*.yml` | Azure Pipelines YAML, by convention `azure-pipelines.yml`. Any path works, but a pipeline object must be created that points to it. | GitLab CI/CD, `.gitlab-ci.yml` at the root (path configurable) | Bitbucket Pipelines, `bitbucket-pipelines.yml` at the root | Gitea Actions: `.gitea/workflows/` (also reads `.github/workflows/`, U). Forgejo Actions: `.forgejo/workflows/` (falls back to `.github/workflows/`, U). Codeberg: hosted Forgejo Actions is "open alpha" and limited; Woodpecker CI (`.woodpecker.yaml` or `.woodpecker/`) needs an access request; your own runners also work. |
| Trigger: PR | `pull_request`, `pull_request_target` | For Azure Repos, PR builds come from the build validation branch policy. YAML `pr:` works only for GitHub and Bitbucket repos. | `rules: - if: $CI_PIPELINE_SOURCE == "merge_request_event"` | `pull-requests:` section (matched by source branch glob) | `pull_request`, `pull_request_target` |
| Trigger: push to main | `push: branches: [main]` | `trigger: branches: include: [main]` | `if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH` | `branches: main:` | `push: branches: [main]` |
| Trigger: manual | `workflow_dispatch` | Manual run with runtime `parameters:` | Run pipeline (`web` / `api` source); `when: manual` jobs | `custom:` pipelines; `trigger: manual` steps | `workflow_dispatch` |
| Environments | Environments (`jobs.<id>.environment`). On private repositories they need Pro, Team or Enterprise; on GitHub Free they exist only for public repositories. | Environments (deployment jobs with `environment:`) | Environments in all tiers | Deployment environments (Test / Staging / Production types; `deployment:` on a step), on every plan | Gitea ignores `environment:`; Forgejo does not document it. Effectively none. |
| Secrets and variables | Secrets and variables at repository, environment and organization level; OIDC. Environment secrets follow the environment plan limit above ("If you are using GitHub Free, environment secrets are only available in public repositories."). | Secret pipeline variables; variable groups in Library (project level, can link Azure Key Vault), linked per stage; secure files; service connections | CI/CD variables at project, group and instance level: masked, protected (protected refs only), hidden. Project-level variables can have an environment scope on every tier; group-level environment scope needs Premium. | Workspace, repository and deployment variables, each optionally secured; OIDC. Deployment variables belong to one deployment environment, exist on every plan, and are usable only in deployment steps. | Secrets and variables at user, organization and repository level only. None per environment. |

Where secrets cannot be scoped to an environment, the environment goes in the name: `STAGING_DB_URL`, `PROD_DB_URL`.

### Review comments and tooling

| Concept | GitHub | Azure DevOps | GitLab | Bitbucket Cloud | Gitea / Forgejo / Codeberg |
|---|---|---|---|---|---|
| AI review in CI | claude-code-action, with the Claude GitHub App installed | A CI job runs the Claude Code CLI headless (`claude -p`, not `--bare`) with an API key stored as a secret, told to read `REVIEW.md` and `AGENTS.md` first, and posts comments through the comment API below | Same as Azure DevOps | Same as Azure DevOps | Same as Azure DevOps |
| Inline PR comments via API (AI review bot) | `POST /repos/{o}/{r}/pulls/{n}/reviews` with `comments[]` (`path`, `line`, `side`), or `POST .../pulls/{n}/comments`. Threads are resolvable through GraphQL `resolveReviewThread`. | `POST .../pullRequests/{id}/threads?api-version=7.1` with `threadContext {filePath, rightFileStart{line,offset}, rightFileEnd}`. Thread status is active, fixed or closed. No `az` command exists for it. | `POST /projects/:id/merge_requests/:iid/discussions` with `position` (`base_sha`, `start_sha`, `head_sha`, `position_type=text`, `new_path`, `new_line`). Threads are resolvable. | `POST /2.0/repositories/{ws}/{repo}/pullrequests/{id}/comments` with `inline: {path, to}`; a PR tasks API; Code Insights reports and annotations per commit | `POST /api/v1/repos/{o}/{r}/pulls/{n}/reviews` with `comments[] {path, body, new_position or old_position}`; `gt pr review --comments-file` |
| CLI | `gh` (2.94 or later for dependencies) | `az` with the `azure-devops` extension (`az boards`, `az repos`, `az pipelines`) | `glab` | No official Bitbucket CLI for PRs was confirmed. Use the REST API with an API token (app passwords are being retired, U for dates); Atlassian's remote MCP server has PR tools; `acli jira workitem` covers Jira. | Gitea: `gt` (the official gitea-cli, which replaces `tea`). Forgejo / Codeberg: `fj` (forgejo-cli, version 0.x). Both forges also take REST at `/api/v1`. |
| Dependency updates | Renovate, or Dependabot version and security updates (`.github/dependabot.yml`), free. Dependabot exists only on GitHub. | Renovate | Renovate | Renovate (supports Bitbucket Cloud) | Renovate (supports Gitea and Forgejo) |

## 2. Branch kinds the project's checks recognise

| Branch | Checks that apply |
|---|---|
| Issue branch `<type>/<n>-<short>` | Every check |
| `scratch/<n>-<short>` | Only the commit message format. It is never merged, so no platform needs special support for it. |
| `release/<version>` | Only the fixed PR title `chore(release): <version>`, with no issue number |
| `renovate/*` (dependency updates) | Only the titles `fix(deps)` and `chore(deps)`, with no issue number and no `Step:` trailer |

On Bitbucket, `<n>` is the Jira key, for example `feature/KEY-12-login`.

## 3. Merging: wait, verify, merge

The main agent verifies before every merge, on every platform, even where the platform enforces the rules itself. It merges only when all three hold:

1. Every required check has passed on the head commit.
2. The branch contains the latest `main`. On every platform: `git fetch origin` then `git merge-base --is-ancestor origin/main origin/B` (exit code 0 means up to date). If not, the agent merges `main` into the branch, pushes and waits for CI again.
3. The approval condition holds: no human approval needed for the PR's risk level, or the human approval is present and newer than the last commit.

### Wait for CI with one blocking command

The agent runs this in the background and reads the result when it ends.

| Platform | Command |
|---|---|
| GitHub | `gh pr checks P --watch --required` (exits non-zero when a required check fails) |
| Azure DevOps | No waiting command. A poll loop such as `until [ "$(az pipelines runs show --id RUN --query status -o tsv)" = completed ]; do sleep 30; done` (U for the status values) |
| GitLab | `glab ci status --branch B --wait` (`--live` also blocks until the pipeline ends; exit code not documented, U) |
| Bitbucket Cloud | A poll loop on `GET /2.0/repositories/WS/REPO/pullrequests/P/statuses` until no status is `INPROGRESS` |
| Gitea / Forgejo | A poll loop on `GET /api/v1/repos/O/R/commits/SHA/status` until `state` is not `pending` (U whether `gt pr checks P` can wait) |

### Verify before merging

| Platform | Checks and approval | Platform rule that also enforces it |
|---|---|---|
| GitHub | `gh pr checks P --required` (exit code 0 only when all pass) and `gh pr view P --json labels,mergeStateStatus,headRefOid,reviewDecision,commits` (`mergeStateStatus` is `CLEAN` when nothing blocks) | Required status checks, "Require branches to be up to date before merging", the label check |
| Azure DevOps | `az repos pr policy list --id P` (every required evaluation `approved`) and `az repos pr show --id P` (reviewer votes, `lastMergeSourceCommit`) | Build validation with expiry, required reviewer group |
| GitLab | `glab api projects/:id/merge_requests/P` and read `detailed_merge_status` (`mergeable` when nothing blocks), `head_pipeline.status`, `labels` and `sha` | "Pipelines must succeed", fast-forward merge method, the label job |
| Bitbucket Cloud | `GET .../pullrequests/P/statuses` (all `SUCCESSFUL`), `GET .../pullrequests/P` (participants with `approved: true` from the reviewer group) and `GET .../pullrequests/P/commits` (approval newer than the last commit, U for the approval timestamp field) | Merge checks, enforced only on Premium |
| Gitea / Forgejo | `GET /api/v1/repos/O/R/commits/SHA/status` (`state` is `success`) and `GET /api/v1/repos/O/R/pulls/P` (`mergeable`, `labels`) | Status checks, "Block merge if pull request is outdated", the label check |

### Merge

| Platform | Command (squash) |
|---|---|
| GitHub | `gh pr merge P --squash --match-head-commit SHA` |
| Azure DevOps | `az repos pr update --id P --status completed --squash true --transition-work-items true` |
| GitLab | `glab mr merge P --squash --sha SHA` (U for `--sha`) |
| Bitbucket Cloud | `POST /2.0/repositories/WS/REPO/pullrequests/P/merge` with `{"merge_strategy":"squash"}` |
| Gitea / Forgejo | `gt pr merge P --squash` (U for the flag form); API `POST /api/v1/repos/O/R/pulls/P/merge` with `{"Do":"squash","head_commit_id":"SHA"}` |

## 4. Setting secrets

Every command reads the value from standard input or a file, never from a command-line argument, so the value stays out of the shell history and the process list.

| Platform | Command |
|---|---|
| GitHub | `gh secret set NAME < value.txt` (or piped stdin); several at once from a dotenv file: `gh secret set -f secrets.local.env`. Add `--env E` only where environments exist (section 1). |
| Azure DevOps | `az pipelines variable-group variable create --group-id G --name NAME --secret true` without `--value`. The CLI takes the value from the environment variable `AZURE_DEVOPS_EXT_PIPELINE_VAR_NAME` or prompts for it on standard input. |
| GitLab | `glab variable set NAME --masked --protected --scope E < value.txt` (the value comes from standard input when `--value` is left out) |
| Bitbucket Cloud | `curl -X POST -u "$BB_USER:$BB_TOKEN" -H "Content-Type: application/json" --data @body.json https://api.bitbucket.org/2.0/repositories/WS/REPO/pipelines_config/variables/` with `{"key":"NAME","value":"...","secured":true}` in `body.json`, then delete `body.json`. Deployment variables go to `.../deployments_config/environments/{uuid}/variables` (U). |
| Gitea / Forgejo | `curl -X PUT -H "Authorization: token $TOKEN" -H "Content-Type: application/json" --data @body.json https://HOST/api/v1/repos/O/R/actions/secrets/NAME` with `{"data":"..."}` in `body.json`, then delete `body.json` (U for Forgejo) |

## 5. Deployment jobs and releases

Every deployment to production, and every `/deploy <target>` and `/perf-test <target>` run, is a manually started CI/CD job, so the secrets stay inside the platform. Staging deploys automatically after each merge to `main`.

| Platform | Manual job | Start it | Read the result |
|---|---|---|---|
| GitHub | `workflow_dispatch` with `inputs:` | `gh workflow run deploy.yml --ref main -f target=staging` | `gh run list --workflow deploy.yml --limit 1 --json databaseId`, then `gh run watch RUN --exit-status` and `gh run view RUN --log-failed` |
| Azure DevOps | Manual run with runtime `parameters:` | `az pipelines run --name NAME --branch main --parameters target=staging` | `az pipelines runs show --id RUN` (`status`, `result`) |
| GitLab | A pipeline started by API with variables, or a `when: manual` job | `glab api -X POST projects/:id/pipeline -f ref=main -f "variables[][key]=TARGET" -f "variables[][value]=staging"` (U for the form encoding); a manual job: `POST /projects/:id/jobs/:job_id/play` | `glab ci status --branch main --wait`; `glab ci trace JOB` (U) |
| Bitbucket Cloud | `custom:` pipeline | `POST /2.0/repositories/WS/REPO/pipelines/` with `{"target":{"type":"pipeline_ref_target","ref_type":"branch","ref_name":"main","selector":{"type":"custom","pattern":"deploy"}},"variables":[{"key":"TARGET","value":"staging"}]}` (U for the exact body) | `GET .../pipelines/{uuid}` (`state.result`) and `GET .../pipelines/{uuid}/steps/{step}/log` |
| Gitea / Forgejo | `workflow_dispatch` | API `POST /api/v1/repos/O/R/actions/workflows/deploy.yml/dispatches` with `{"ref":"main","inputs":{"target":"staging"}}` (U for version support); `gt workflow` (U), `fj actions` (U) | Actions run list in the API or UI (U for the endpoint) |

Releases:

| Platform | Tag and release |
|---|---|
| GitHub | `gh release create vX.Y.Z --notes-file notes.md` (creates the tag when it does not exist) |
| Azure DevOps | Tags only: `git tag vX.Y.Z` and `git push origin vX.Y.Z` (U whether any release object exists for repositories) |
| GitLab | `glab release create vX.Y.Z --notes-file notes.md` |
| Bitbucket Cloud | Tags only: `git tag vX.Y.Z` and `git push origin vX.Y.Z` (U) |
| Gitea / Forgejo | Releases: API `POST /api/v1/repos/O/R/releases` with `{"tag_name":"vX.Y.Z","body":"..."}`; `gt release create` (U), `fj release create` (U) |

## 6. Plans and free CI minutes

Finding the plan:

| Platform | How |
|---|---|
| GitHub | `gh api user --jq .plan.name` for a personal account; `gh api orgs/O --jq .plan.name` for an organization (U whether a non-owner sees the field) |
| Azure DevOps | Organization settings > Billing, and Organization settings > Pipelines > Parallel jobs (U for a CLI command) |
| GitLab | gitlab.com: `glab api namespaces/NS` and read `plan` (U); self-managed: Admin area > Subscription |
| Bitbucket Cloud | Workspace settings > Plan details (U) |
| Gitea / Forgejo | Self-hosted instances have no plans. Codeberg is free. |

Free CI minutes (verified 2026-11-19):

| Platform | Free allowance |
|---|---|
| GitHub | Free: 2,000 minutes a month for private repositories; public repositories unlimited on standard runners |
| Azure DevOps | 1 Microsoft-hosted parallel job with 1,800 minutes a month, and 1 free self-hosted parallel job. New organizations may have to request the free grant for private projects (U whether that still applies). |
| GitLab | gitlab.com Free: 400 compute minutes a month. Running pipelines only for merge requests and `main` saves minutes. |
| Bitbucket Cloud | Free: 50 build minutes a month |
| Gitea / Forgejo | Jobs run on runners you host, with no minute limit. Codeberg's hosted CI is limited. |

Which plans enforce branch rules and required checks:

| Platform | Enforcement |
|---|---|
| GitHub | Private repositories need Pro or Team; public repositories on every plan |
| Azure DevOps | Branch policies on every plan |
| GitLab | Free enforces protected branches and "Pipelines must succeed", which is enough for the flow |
| Bitbucket Cloud | Only Premium enforces merge checks; other plans only warn |
| Gitea / Forgejo | Branch protection on every instance |

## 7. Signing in to each CLI

The user runs these themselves by typing `! <command>` in the prompt.

| Platform | Command |
|---|---|
| GitHub | `gh auth login` |
| Azure DevOps | `az login`, then `az devops login --organization https://dev.azure.com/ORG` with a personal access token |
| GitLab | `glab auth login` |
| Bitbucket Cloud | An API token for the REST calls; `acli jira auth login` for Jira (U for the exact syntax) |
| Gitea / Forgejo | Gitea: `gt login add` (U); Forgejo: `fj auth login` (U) |

## 8. Per-platform notes

### GitHub

- **Plan:** Everything dev-workflow needs exists natively; the gaps are plan-dependent. Branch rules and required checks on private repositories need Pro or Team. Environments and environment secrets on private repositories need Pro, Team or Enterprise; on Free, secrets for private repositories use the naming convention (`STAGING_*`, `PROD_*`).
- **Labels:** Creating an issue with a label that does not exist fails, so /kickoff creates the labels first (`gh label create`).
- **Dependencies:** They are informational. The agent reads `blocked_by` before it starts an issue; GitHub will not stop it. Dependencies need `gh` 2.94 or later; with an older `gh`, use `gh api` with the REST issue-dependencies endpoints.
- **Human-approval label:** A small workflow that becomes a required status check. Its success depends on the `human-reviewed` label, and it reruns on `labeled` / `unlabeled`. A second workflow on `synchronize` removes the label when a commit is pushed.
- **Path filters:** A required check must come from a workflow that always runs; the job decides with `if:` whether it has work to do.

### Azure DevOps

- **Work item type:** Every issue is created as the process's general work item type (Basic: Issue; Agile: User Story; Scrum: Product Backlog Item; CMMI: Requirement). Type and size are tags. Tags need no creation; setting `System.Tags` replaces all tags, so the agent writes the full list.
- **Dependencies:** Use the Predecessor/Successor link. Nothing enforces it, so the agent checks it itself. `az boards work-item relation list-type` lists the relation names the organization accepts.
- **PR checks:** PR CI is not set in YAML for Azure Repos. A build validation branch policy points at the pipeline (`az pipelines create`, `az repos policy build create`), and expires immediately when `main` updates, which keeps the branch up to date.
- **No `az` command for PR comments:** AI review comments go through the Pull Request Threads REST API, called with `az devops invoke` or `curl` and a PAT. Inline comments use `threadContext`. The comment-resolution policy then blocks completion until each thread is resolved or marked won't fix.
- **Human approval:** A required reviewer group of humans, with "reset votes on new pushes" on.
- **Closing work items:** Link the work item to the PR with "transition work items".

### GitLab

- **Free is enough for the flow:** Protected branches, "Pipelines must succeed" and "All threads must be resolved" exist on every tier. Free lacks required approvals, blocking links between issues and group-level environment scope for variables.
- **Free-tier fallbacks:**
  - Dependencies: `Blocked by #12` in the issue body or `relates_to` links; the agent checks the referenced issues' state before starting.
  - Approvals: a pipeline job that fails without the `human-reviewed` label. After the label is added, the agent creates a new merge request pipeline (`POST /projects/:id/merge_requests/:iid/pipelines`), because adding a label starts no pipeline and the old job sees the old labels.
  - Removing the label after a new commit: the job needs a token that can edit merge requests. The CI job token cannot. On gitlab.com, project access tokens need Premium or Ultimate ("On GitLab.com, project access tokens require a Premium or Ultimate subscription"); on self-managed any license has them. On gitlab.com Free, use a personal access token stored as a masked CI/CD variable.
- **Merge method is project-wide:** Fast-forward with squash set to "Require", so `main` gets no merge commits. A branch with `main` merged into it satisfies fast-forward, and the squash removes that merge commit.
- **Minutes:** gitlab.com Free has 400 compute minutes a month, so pipelines run only for merge requests and `main`.

### Bitbucket Cloud

- **Issues live in Jira:** Issue creation, type and size labels, and dependencies ("blocks" links) all go through Jira (`acli jira workitem` or the Jira REST API). Issue references are Jira keys. The PR is linked by putting the Jira key in the branch name and PR title. Closing on merge is a Jira automation rule ("PR merged, then transition to Done").
- **Enforcement needs Premium:** Without it, merge checks only warn, and a person can still merge. The agent checks everything itself before merging (section 3), and tells the user that the platform does not enforce it.
- **No resolved-threads check:** The AI reviewer opens a PR task (tasks API) for each finding it wants addressed, and the merge check "No unresolved pull request tasks" stands in for resolved threads.
- **No labels on PRs:** The risk level goes in the PR description. Human approval is an approval from a designated reviewer group. Resetting approvals on change needs Premium; otherwise the agent checks that the approval is newer than the last commit.
- **Deployments:** Deployment environments and deployment variables exist on every plan; deployment variables are usable only in deployment steps. A `custom:` pipeline is the manual job.
- **Not built in:** CLI and dependency updates. Use the REST API (API tokens) and Renovate.

### Gitea, Forgejo and Codeberg

- **Labels and dependencies:** Type and size are labels created by /kickoff. Issue dependencies exist but must be switched on per repository (Settings > enable dependencies). The CLIs do not cover them, so use the REST endpoint `/repos/{o}/{r}/issues/{n}/dependencies`.
- **No resolved-conversations check:** Two fallbacks:
  - the AI reviewer submits a "request changes" review while findings are open, with "block merge on rejected reviews" enabled, and approves or dismisses it once they are fixed; or
  - a status-check workflow fails while unresolved review comments remain (via API).
- **Up to date:** "Block merge if pull request is outdated".
- **No environments or environment secrets:** Gitea ignores `environment:`. Secrets exist only at user, organization and repository level, so staging and production use different names (`STAGING_*`, `PROD_*`). Production sits behind a separate `workflow_dispatch` workflow.
- **Codeberg CI:** Hosted Forgejo Actions is limited ("open alpha"). Woodpecker CI needs an access request, offers only `linux/amd64`, and comes "as-is". For anything heavy, recommend self-hosted runners. The architect step asks which runner the project uses.
- **CLI:** Gitea's official `gt` covers issues, PRs, checks, comments and inline reviews (`--comments-file`). `tea` is the older tool it replaces. Forgejo's `fj` is version 0.x and its flags change between releases, so check `fj <cmd> --help`. Use `/api/v1` with a token for anything missing.

## 9. Concepts missing somewhere, and their fallbacks

| Concept | Missing on | Fallback |
|---|---|---|
| Enforced "blocked by" | Every platform (informational only, except Gitea/Forgejo, U) | The agent reads dependencies and refuses to start a blocked issue |
| Dependency links | GitLab Free; Bitbucket without Jira | `Blocked by #N` in the issue body, parsed by the agent; `relates_to` links |
| PR labels | Bitbucket | Risk level in the PR description; human approval from a reviewer group |
| Review threads resolved | Bitbucket; Gitea/Forgejo | PR tasks (Bitbucket); a "request changes" review or a status check (Gitea/Forgejo) |
| Human-approval label gate | Every platform (no native label gate) | A required status check driven by the label; on Azure DevOps and Bitbucket, a required human reviewer group |
| Approval reset on a new commit | Bitbucket below Premium | The agent checks that the approval is newer than the last commit |
| Branch up to date before merge | Bitbucket (U) | The agent checks with `git merge-base --is-ancestor` before merging |
| Enforced required approvals and checks | GitLab Free (approvals); Bitbucket below Premium (all merge checks) | The agent verifies before merging and tells the user that the platform does not enforce it |
| Environments and environment secrets | Gitea/Forgejo; GitHub Free private repositories | A naming convention per environment (`STAGING_*`, `PROD_*`) |
| Comment-on-PR CLI command | Azure DevOps; Bitbucket | REST (`az devops invoke` / `curl`) |
| Blocking wait for CI | Azure DevOps, Bitbucket, Gitea/Forgejo | A poll loop run as one background command (section 3) |
| Dependabot | Every platform except GitHub | Renovate |

## 10. CLI commands

| Task | GitHub (`gh`) | Azure DevOps (`az`) | GitLab (`glab`) | Bitbucket Cloud (REST + Jira `acli`) | Gitea (`gt`) / Forgejo (`fj`) |
|---|---|---|---|---|---|
| Create label | `gh label create type:feature --color C --description D` | Not needed (tags and PR labels are created when first used, U for PR labels) | `glab label create --name type:feature --color '#RRGGBB'` (U flags) | Not needed (Jira labels are created when first used) | API `POST /api/v1/repos/O/R/labels` with `{"name":"type:feature","color":"#RRGGBB"}`; `gt labels create` (U) |
| Create issue | `gh issue create --title T --body-file f.md --label type:feature --label size:M` | `az boards work-item create --type "User Story" --title T --description D --fields "System.Tags=type:feature; size:M"` (type per process, section 1) | `glab issue create -t T -d D -l type:feature,size:M` | `acli jira workitem create --project KEY --type Task --summary T --label type:feature,size:M --description-file f.md` (U for the label list form) | `gt issue create -t T -b D -l type:feature,size:M` (U list form); `fj issue create` (flags U) |
| Set label on an issue | `gh issue edit N --add-label L` | `az boards work-item update --id N --fields "System.Tags=a; b"` (replaces all tags) | `glab issue update N --label L` (U) | `acli jira workitem edit --key K --labels L` (U) | `gt issue edit N --add-label L` (U) |
| Set label on a PR | `gh pr edit P --add-label risk:low`; `--remove-label human-reviewed` | `az devops invoke --area git --resource pullRequestLabels ...` (U) | `glab mr update P --label risk:low`; `--unlabel human-reviewed` (U) | No PR labels | API `POST /api/v1/repos/O/R/issues/P/labels` with `{"labels":["risk:low"]}` (U whether names are accepted) |
| Add dependency | `gh issue edit N --add-blocked-by 12`; at creation `--blocked-by 12` | `az boards work-item relation add --id N --relation-type Predecessor --target-id 12` | `glab api -X POST projects/:id/issues/N/links -f target_project_id=ID -f target_issue_iid=12 -f link_type=is_blocked_by` (Premium); or `--linked-issues 12 --link-type is_blocked_by` on create (U values) | `acli jira workitem link ...` (flags U) | `POST /api/v1/repos/O/R/issues/N/dependencies` with `{"owner":"O","repo":"R","index":12}` (U body) |
| Create PR | `gh pr create --base main --head B --title T --body-file pr.md` (body contains `Closes #N`) | `az repos pr create --source-branch B --target-branch main --title T --description D --work-items N` | `glab mr create --source-branch B --target-branch main --title T --description "Closes #N" --squash-before-merge` | `POST /2.0/repositories/WS/REPO/pullrequests` with `{"title":T,"source":{"branch":{"name":B}},"destination":{"branch":{"name":"main"}}}` | `gt pr create -B main -H B -t T -b "Closes #N"`; `fj pr create` (flags U) |
| View checks once | `gh pr checks P --required` | `az repos pr policy list --id P` | `glab ci status --branch B` | `GET .../pullrequests/P/statuses` | `gt pr checks P` |
| Wait for CI | Section 3 | Section 3 | Section 3 | Section 3 | Section 3 |
| Merge | Section 3 | Section 3 | Section 3 | Section 3 | Section 3 |
| Comment on PR | `gh pr comment P --body-file f.md` | No command: `az devops invoke --area git --resource pullRequestThreads --route-parameters project=X repositoryId=R pullRequestId=P --http-method POST --in-file thread.json --api-version 7.1` (U) | `glab mr note P -m "text"` (U subcommand form) | `POST .../pullrequests/P/comments` with `{"content":{"raw":"text"}}` | `gt pr comment P -b text` |
| Inline review comment | `gh api -X POST repos/O/R/pulls/P/reviews --input review.json` (`comments[]` with `path`, `line`, `side`) | Same `invoke` with `threadContext` in `thread.json` | `glab api -X POST projects/:id/merge_requests/P/discussions` with `position[...]` fields (U) | Same comments endpoint plus `"inline":{"path":"src/a.py","to":42}`; tasks via `POST .../pullrequests/P/tasks` (U) | `gt pr review P -c --comments-file inline.json` |
| New pipeline for the label check | `gh run rerun` is not needed: the check reruns on `labeled` | Not needed (reviewer votes) | `glab api -X POST projects/:id/merge_requests/P/pipelines` | Not needed (reviewer approval) | Not needed (the check reruns on label events) |
| Start a manual job | Section 5 | Section 5 | Section 5 | Section 5 | Section 5 |
| Set secret | Section 4 | Section 4 | Section 4 | Section 4 | Section 4 |
| Branch protection setup | `gh api -X POST repos/O/R/rulesets --input ruleset.json` | `az repos policy build create`, `approver-count create`, `comment-required create`, `merge-strategy create --allow-squash true`, `work-item-linking create` | `glab api` on `projects/:id/protected_branches` and the project settings (`merge_method`, `squash_option`, `only_allow_merge_if_pipeline_succeeds`) | `POST .../branch-restrictions` (U) | `POST /api/v1/repos/O/R/branch_protections` |
| Create release | Section 5 | Section 5 | Section 5 | Section 5 | Section 5 |

## 11. Sources

GitHub:

- Issue dependencies REST API: https://docs.github.com/en/rest/issues/issue-dependencies
- Creating issue dependencies (CLI flags `--blocked-by`, `--add-blocked-by`): https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-issue-dependencies
- `gh issue create` manual: https://cli.github.com/manual/gh_issue_create
- GitHub CLI 2.94 changelog (dependencies): https://github.blog/changelog/2026-06-10-manage-sub-issues-types-and-dependencies-from-github-cli/
- Ruleset rules (allowed merge methods, `required_review_thread_resolution`): https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets
- Deployments and environments (plan limits on environments and environment secrets; verified 2026-11-19): https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments
- Plans: https://docs.github.com/en/get-started/learning-about-github/githubs-plans

Azure DevOps:

- `az repos pr` reference (create/update flags, no comment command): https://learn.microsoft.com/en-us/cli/azure/repos/pr
- Merge strategy policy CLI: https://learn.microsoft.com/en-us/cli/azure/repos/policy/merge-strategy
- `az boards work-item relation`: https://learn.microsoft.com/en-us/cli/azure/boards/work-item/relation
- `az pipelines variable-group variable` (secret value from `AZURE_DEVOPS_EXT_PIPELINE_VAR_` or standard input; verified 2026-11-19): https://learn.microsoft.com/en-us/cli/azure/pipelines/variable-group/variable
- Link types reference: https://github.com/MicrosoftDocs/azure-devops-docs/blob/main/docs/boards/queries/link-type-reference.md
- Track dependencies (Delivery Plans): https://learn.microsoft.com/en-us/azure/devops/boards/plans/track-dependencies
- Branch policies: https://github.com/MicrosoftDocs/azure-devops-docs/blob/live/docs/git/branch-policies.md
- Complete pull requests: https://learn.microsoft.com/en-us/azure/devops/repos/git/complete-pull-requests
- Resolution mentions: https://learn.microsoft.com/en-us/azure/devops/repos/git/resolution-mentions
- Pull Request Threads - Create: https://learn.microsoft.com/en-us/rest/api/azure/devops/git/pull-request-threads/create
- Pricing (free parallel jobs and minutes; verified 2026-11-19): https://azure.microsoft.com/en-us/pricing/details/devops/azure-devops-services/
- Dependabot security updates roadmap item: https://learn.microsoft.com/en-us/azure/devops/release-notes/roadmap/2024/ghazdo/dependabot
- Community Dependabot extension: https://github.com/tinglesoftware/dependabot-azure-devops

GitLab:

- Linked items (blocking is Premium): https://docs.gitlab.com/user/work_items/linked_items/
- Linked issues: https://docs.gitlab.com/user/project/issues/related_issues/
- Merge request approvals: https://docs.gitlab.com/user/project/merge_requests/approvals
- Approval rules (Premium): https://docs.gitlab.com/user/project/merge_requests/approvals/rules
- CI/CD variables (environment scope per tier; verified 2026-11-19): https://docs.gitlab.com/ci/variables/
- Project access tokens (Premium or Ultimate on gitlab.com; verified 2026-11-19): https://docs.gitlab.com/user/project/settings/project_access_tokens/
- `glab variable set` (value from standard input; verified 2026-11-19): https://docs.gitlab.com/cli/variable/set/
- `glab ci status` (`--wait`, `--live`; verified 2026-11-19): https://docs.gitlab.com/cli/ci/status/
- `glab issue create`: https://docs.gitlab.com/cli/issue/create
- `glab mr create`: https://docs.gitlab.com/cli/mr/create
- `glab mr merge`: https://docs.gitlab.com/cli/mr/merge/

Bitbucket Cloud and Jira:

- Sunset of Bitbucket Issues and Wikis: https://community.atlassian.com/forums/Bitbucket-articles/Announcing-sunset-of-Bitbucket-Issues-and-Wikis/ba-p/3193882
- GitLab tracking of the removal: https://gitlab.com/gitlab-org/gitlab/-/work_items/601061
- Merge checks: https://support.atlassian.com/bitbucket-cloud/docs/suggest-or-require-checks-before-a-merge/
- Merge strategies: https://www.atlassian.com/blog/bitbucket/branch-sync-merge-rebase
- Pricing (build minutes, Premium merge checks; verified 2026-11-19): https://www.atlassian.com/software/bitbucket/pricing
- Bitbucket via MCP: https://support.atlassian.com/bitbucket-cloud/docs/interacting-with-bitbucket-via-mcp/
- `acli jira workitem create`: https://developer.atlassian.com/cloud/acli/reference/commands/jira-workitem-create/

Gitea, Forgejo and Codeberg:

- Gitea Actions compared with GitHub Actions (`environment` ignored): https://docs.gitea.com/usage/actions/comparison
- Forgejo Actions reference: https://forgejo.org/docs/latest/user/actions/reference/
- Forgejo branch protection: https://forgejo.org/docs/latest/user/protection/
- Codeberg CI: https://docs.codeberg.org/ci/
- Gitea official CLI `gt`: https://gitea.com/gitea/cli
  - `gt pr merge`: https://man.archlinux.org/man/gt-pr-merge.1.en
  - `gt pr`: https://man.archlinux.org/man/gt-pr.1.en
  - `gt pr review`: https://man.archlinux.org/man/gt-pr-review.1.en
  - `gt issue create`: https://man.archlinux.org/man/gt-issue-create.1.en
  - `gt pr create`: https://man.archlinux.org/man/gt-pr-create.1.en
- Forgejo CLI `fj`: https://codeberg.org/forgejo-contrib/forgejo-cli
- Gitea review comment structs: https://github.com/go-gitea/gitea/blob/main/modules/structs/pull_review.go

Items that stay marked (U) until verified:

- Gitea's full branch-protection option list
- Whether Gitea/Forgejo enforce dependencies on merge
- The `fj` flags and the Gitea/Forgejo login, release and workflow commands
- How each platform other than GitHub treats a required check skipped by a path filter
- Bitbucket's branch up-to-date check, approval timestamps and API-token dates
- Several `glab` subcommand forms
