# Claude Code facts for the redesign

Checked against the official Claude Code and Claude API documentation on 2026-11-17. Items marked "unverified" were not confirmed in the docs.

## 1. Prompt caching

Sources: https://code.claude.com/docs/en/prompt-caching.md, https://platform.claude.com/docs/en/build-with-claude/prompt-caching.md

- Default TTL: 5 minutes for subagents on every billing plan. The main conversation gets 1 hour on a Claude subscription within plan usage, and 5 minutes on an API key or usage credits.
- Override order: `FORCE_PROMPT_CACHING_5M=1`, then `CLAUDE_CODE_SUBAGENT_PROMPT_CACHE_TTL`, then the `subagentPromptCacheTtl` setting, then the subagent frontmatter `experimental.cacheTtl` (v2.1.248+, plugin agents support it), then `ENABLE_PROMPT_CACHING_1H=1`, then the default.
- Each cache hit restarts the lifetime from the start of the request. The docs describe refresh only on requests. A subagent that runs an hour-long shell command makes no request meanwhile, so its cache expires (derived from the docs, not tested).
- Price multipliers on base input: 5-minute cache write 1.25x, 1-hour cache write 2x, cache read 0.1x (Opus 5.5 and Sonnet 5.5 read at 0.05x; Fable 5.x at 0.025x).
- Every tool call the main agent makes is one more request over the whole conversation. Combining commands into one call, and waiting for long work with one blocking command run in the background, keeps the number of requests down.
- Resume versus fresh after expiry (derived): resuming writes the whole transcript to the cache again at 1.25x (2x with a 1-hour TTL). A fresh subagent writes only its brief but must re-read files to rebuild context. Example at $3 per million input tokens: rewriting a 150k-token transcript costs about $0.56; a 5k-token brief about $0.02. Resuming pays off only when the transcript saves more re-exploration than the rewrite costs.

## 2. Resuming subagents

Source: https://code.claude.com/docs/en/sub-agents.md

- Each invocation is a new instance unless resumed. On completion the caller receives an agent ID; `SendMessage` to that ID or name resumes it. No agent teams needed.
- A resumed subagent keeps its full history: tool calls, results and reasoning.
- Limits: Explore and Plan agents are one-shot and cannot be resumed. A subagent the user stopped does not resume by itself. One that hit `maxTurns` is marked partial and can be resumed. Resuming takes a new concurrency slot without a limit check.
- Transcripts live in `~/.claude/projects/{project}/{sessionId}/subagents/agent-{agentId}.jsonl` and are deleted after `cleanupPeriodDays` (default 30).
- Not stated: a context ceiling for resumed subagents.

## 3. Subagents

Sources: https://code.claude.com/docs/en/sub-agents.md, https://code.claude.com/docs/en/plugins/components.md, https://code.claude.com/docs/en/worktrees.md

- Background: a subagent spawned from the main conversation starts in the background by default; `background: true` keeps it there. Background subagents get a smaller tool set (Read, Grep, Glob, Bash, Edit, Write, WebFetch, WebSearch and some others) plus MCP tools; permission prompts surface in the main session.
- Worktree isolation: `isolation: worktree`. The worktree branches from the default branch unless `worktree.baseRef` is `head`. It is removed automatically when nothing changed, otherwise kept until the cleanup sweep.
- A subagent in a default-location worktree does not load the worktree root `CLAUDE.md` or `.claude/rules/`. Shared rules must go into the instructions the subagent receives.
- Model per subagent: `sonnet`, `opus`, `haiku`, `fable`, a full model ID, or `inherit`. Precedence: the per-invocation parameter, the `model` field, `CLAUDE_CODE_SUBAGENT_MODEL`, the main model.
- Plugin agent files (`agents/*.md`) support `name`, `description`, `model`, `effort`, `maxTurns`, `tools`, `disallowedTools`, `skills`, `memory`, `background`, `isolation`, `color`, `experimental.cacheTtl`. Ignored in plugins: `permissionMode`, `hooks`, `mcpServers`, `initialPrompt`. Names cannot contain ":".
- Parallel limit: 20 concurrent subagents by default (`CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`), no cap on the total, nesting depth 3 (`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`).
- Always unavailable to subagents: AskUserQuestion, EnterPlanMode, ScheduleWakeup, WaitForMcpServers, Workflow. Questions to the user must be asked by the main agent.

## 4. Built-in code-quality commands

Sources: https://code.claude.com/docs/en/code-review-local.md, https://code.claude.com/docs/en/ultrareview.md, https://code.claude.com/docs/en/commands.md, https://code.claude.com/docs/en/skills.md, https://code.claude.com/docs/en/code-review.md

| Command | What it does | Cost |
|---|---|---|
| `/code-review` (alias `/review`) | Reviews a branch diff, PR, branch, path or commit range for correctness bugs. Levels `low` to `max`: low gives the fewest, most confident findings. `--fix` applies findings; `--comment` posts inline comments on a GitHub PR or one note on a GitLab MR | Normal session usage |
| `/code-review ultra` | Multi-agent review in the cloud, findings verified independently, about 5 to 15 minutes. Needs a claude.ai login | 3 free runs per account on paid plans, then usage credits (docs: typically $5 to $25 per review) |
| `/simplify` | Reuse, simplification and efficiency cleanups, applies fixes | Not stated |
| `/security-review` | Reviews the branch diff against origin's default branch for injection, authentication and data exposure. Needs an origin remote | Not stated |
| `/init` | Writes a starter CLAUDE.md | Not stated |
| `/batch` | Parallel agents in worktrees | Not stated |
| `/verify` | Builds and runs the app | Not stated |
| Managed Code Review | Separate service for Team and Enterprise, GitHub only; levels Quick, Standard, Deep; posts inline comments and a check run; never approves or blocks | Unverified |

## 5. Plugin structure

Sources: https://code.claude.com/docs/en/plugins/components.md, https://code.claude.com/docs/en/plugins/create-marketplace.md, https://code.claude.com/docs/en/skills.md

- Layout: `.claude-plugin/plugin.json` (only `name` required), `skills/<name>/SKILL.md`, `commands/` (legacy), `agents/*.md`, `hooks/hooks.json`, `.mcp.json`, `.lsp.json`, `bin/` (added to PATH), `monitors/monitors.json`, `output-styles/`, `themes/`. A CLAUDE.md at the plugin root is not loaded.
- Marketplace: `.claude-plugin/marketplace.json` requires `name`, `owner` and `plugins`; each entry needs `name` and `source`. Keep the entry name and the manifest name identical.
- Shared files: SKILL.md links to supporting files by relative path; keep SKILL.md under 500 lines; linked files load only when used. `${CLAUDE_PLUGIN_ROOT}` is the install directory (no state there); `${CLAUDE_PLUGIN_DATA}` holds data that survives updates.
- Agent Skills open standard: https://agentskills.io. The Claude Code docs do not name other tools that read it.

## 6. AskUserQuestion

Sources: https://code.claude.com/docs/en/agent-sdk/user-input.md, https://code.claude.com/docs/en/tools-reference.md

- 1 to 4 questions per call, 2 to 4 options each, header at most 12 characters, multi-select supported, the user can always type their own answer.
- Not available to subagents.
- `askUserQuestionTimeout` (60s, 5m, 10m) lets interactive sessions continue past unanswered questions; background sessions wait.

## 7. Hooks

Sources: https://code.claude.com/docs/en/hooks.md, https://code.claude.com/docs/en/hooks-guide.md

- Events include SessionStart, UserPromptSubmit, PreToolUse, PermissionRequest, PostToolUse, PostToolUseFailure, Notification, SubagentStart, SubagentStop, TaskCreated, TaskCompleted, Stop, InstructionsLoaded, ConfigChange, CwdChanged, FileChanged, WorktreeCreate, WorktreeRemove, PreCompact, PostCompact, SessionEnd and others.
- Hook types: shell command, HTTP, MCP tool call, prompt to a model, subagent.
- A plugin ships them in `hooks/hooks.json`; they register when the plugin loads, not when a skill runs.
- In a worktree, `${CLAUDE_PROJECT_DIR}` still points at the main checkout; the `cwd` input field holds the worktree path.

## 8. CI

Sources: https://code.claude.com/docs/en/github-actions.md, https://code.claude.com/docs/en/gitlab-ci-cd.md, https://github.com/anthropics/claude-code-security-review

- `anthropics/claude-code-action` authenticates with an API key (`ANTHROPIC_API_KEY`), a subscription OAuth token (`CLAUDE_CODE_OAUTH_TOKEN` from `claude setup-token`), or OIDC workload identity federation. The docs recommend API keys for shared secrets, since an OAuth token is tied to one person's subscription.
- Cost: CI minutes plus API tokens; OAuth runs draw on the subscription.
- Inline comments: the review workflow runs `/code-review --comment` with `mcp__github_inline_comment__create_inline_comment` allowed.
- Platforms: claude-code-action is GitHub only and needs the Claude GitHub App installed on the repository. GitLab has a separate beta integration maintained by GitLab that runs the claude CLI in pipelines. Azure DevOps: no official integration found (unverified).
- `anthropics/claude-code-security-review`: separate security review action, API key only, comments on the PR, filters some low-value finding types, meant for trusted PRs only (not hardened against prompt injection). MIT.

## 9. Headless runs in other CI systems

Source: https://code.claude.com/docs/en/headless.md

- `claude -p` exits 0 on success and non-zero on failure; `--output-format json` returns the cost, session ID and structured output (with `--json-schema`).
- `--bare` skips hooks, plugins, CLAUDE.md, skills and MCP discovery and uses `ANTHROPIC_API_KEY` only. The dev-workflow review job does not use it: the review needs `CLAUDE.md`, which loads `AGENTS.md`, and its prompt tells it to read `REVIEW.md` and `AGENTS.md` first. It posts its comments through the platform's comment API (`../../issue/references/platforms.md`).
- Unattended permissions: `--permission-mode`, `--allowedTools`, `--permission-prompts none`. With no permission setting, `-p` denies unapproved calls.
- A `-p` run waits up to 10 minutes for background commands and subagents (`CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS`); long Docker test runs need `BASH_DEFAULT_TIMEOUT_MS` raised.
- Azure Pipelines: no official guide (unverified); the generic shell pattern works in any CI.
