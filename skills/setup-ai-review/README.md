# AI 代码审查流程（一个人开发版）

参照 Claude Code 团队的文章《How the Claude Code team does code review》。思路是在"AI 写完代码"和"代码合并上线"之间设几道自动关卡，人只在风险高的地方亲自看。原文是多人团队的做法，这里改成一个人也能用的版本。

它是整套开发流程里"开发到合并"这一段，前后各段见上一级目录的 `DEV-WORKFLOW.md`。

## 怎么用

在任何一个 GitHub 项目里打开 Claude Code，输入：

```
/setup-ai-review
```

Claude 会把通用文件复制进项目，按项目的实际情况填写专属文件，让你选分支策略，再一步步带你完成 GitHub 上的设置。用 /scaffold 搭新项目时，最后会自动调用它。

装好以后，日常流程是这样：

1. 让 Claude 写代码（或者用 `/implement <issue 号>`）。
2. 写完输入 `/open-pr`。Claude 先跑测试和 lint，再在本地做一次代码审查和安全审查，修完问题、整理好提交后开 PR，并开启自动合并。
3. PR 上自动运行这些检查：`ci`（测试、构建）、`commit-lint`（提交信息格式）、`ai-review`（风险分级和 AI 代码审查）、`security-review`（AI 安全审查）。
4. AI 在代码行上留的每条评论，要么让 Claude 修掉，要么写明理由后点 Resolve。
5. 看 PR 上的风险标签：
   - `risk:low`（比如只改了文档）：检查全绿就自动合并。
   - `risk:medium` / `risk:high`：你自己读一遍改动，确认没问题后给 PR 加上 `human-reviewed` 标签，然后会自动合并。
6. 之后只要有新提交，`human-reviewed` 标签就会被自动撤掉，你需要重新看。

## 分支策略

安装时二选一，写进项目的 CLAUDE.md，`/open-pr`、`/implement`、`/release` 都按它走。

| | GitHub Flow | Git Flow |
|---|---|---|
| 默认分支 | main | develop |
| 日常开发 | `feature/`、`fix/` 从 main 拉，PR 合回 main | `feature/`、`fix/` 从 develop 拉，PR 合回 develop |
| 发布 | 在 main 上打版本标签 | 从 develop 拉 `release/x.y.z`，PR 合入 main，打标签，再合回 develop |
| 线上紧急修复 | 和日常一样 | 从 main 拉 `hotfix/x.y.z`，PR 合入 main，再合回 develop |
| 适合 | 一个人、持续发布 | 有明确版本号、需要稳定发布线 |

发布 PR（`release/*` → main）里的代码在合入 develop 时都审查过了，所以不再做 AI 审查，但一律算高风险：合并就是发布，要你确认。从 main 回合并到 develop 的 PR 算低风险，自动合并。

## 每个文件是干什么的

### 通用文件：每个项目都一样，不用改

| 文件 | 作用 |
|---|---|
| `.github/pull_request_template.md` | PR 模板，固定包含 Testing（怎么测的）、Risk（风险）、How to revert（怎么撤回） |
| `.github/ISSUE_TEMPLATE/bug_report.md` | 报 bug 的模板。修好的 bug 可以整理成审查案例 |
| `.github/workflows/ai-review.yml` | 每个 PR 自动做风险分级和 AI 代码审查，中、高风险需要你加标签才能通过 |
| `.github/workflows/security-review.yml` | 每个 PR 自动做 AI 安全审查 |
| `.github/workflows/commits.yml` | 检查 PR 里每个提交的提交信息 |
| `.github/scripts/risk-classify.mjs` | 风险分级脚本，`ai-review` 会调用它 |
| `.github/scripts/check-commit-message.mjs` | 提交信息检查脚本，本地钩子和 CI 共用 |
| `.githooks/commit-msg` | 本地提交时检查提交信息。需要运行一次 `git config core.hooksPath .githooks` 才生效 |
| `.claude/hooks/format.mjs` | Claude 每改完一个文件，就自动运行格式化和 lint |
| `.claude/commands/open-pr.md` | `/open-pr` 命令：自检、本地审查、整理提交，再开 PR |
| `evals/run-review-evals.mjs` | 给 AI 审查员打分的脚本 |

### 项目专属文件：结构固定，内容按项目填写

| 文件 | 写什么 |
|---|---|
| `CLAUDE.md` | 项目简介、组件、**Claude 自己能跑的检查命令**、代码规范、目标与非目标、分支与提交规则。每次审查都会读它，所以要写短 |
| `REVIEW.md` | 告诉 AI 审查员：在这个项目里什么算"坏"、重点查什么、哪些不用报、哪些路径跳过 |
| `.github/workflows/ci.yml` | 每个组件的测试、lint、构建命令，按技术栈来写 |
| `.claude/hooks/format.config.json` | 每个组件目录下，哪种文件用什么工具格式化、用什么工具 lint（格式见下文） |
| `.github/risk-rules.txt` | 哪些路径算高风险、哪些算低风险 |

### 不在代码里，要在 GitHub 网站上设置的

| 设置 | 作用 |
|---|---|
| Claude GitHub App | 让 Claude 能在 PR 上留评论 |
| Secrets | 存放 `CLAUDE_CODE_OAUTH_TOKEN`（订阅用户）或 `ANTHROPIC_API_KEY`（API 用户） |
| 自动合并、合并后删除分支 | 检查通过就自动合并，合并完自动清理分支 |
| 分支规则（Ruleset） | 默认分支和 main 只能通过 PR 修改；`ci`、`risk-gate`、`commit-lint` 通过、所有评论线程都处理完，才能合并 |

本技能的 `github-settings/ruleset.json` 是分支规则的配置，`/setup-ai-review` 会用它创建规则。私有仓库在 GitHub 免费版上用不了分支规则：可以改成公开仓库，或者升级到 GitHub Pro。

### 靠平时积累的：审查案例

`evals/review-cases/` 里每个文件记录一个真实出过的 bug：哪次改动引入的、bug 在哪一行。改了 REVIEW.md 以后，运行 `node evals/run-review-evals.mjs`，看 AI 审查员还能不能抓到这些 bug。分数没涨，就撤回那次修改。详见 `evals/README.md`。

刚开始不用写案例。先用 issue 把出过的 bug 记下来，攒到几个以后再整理成案例。

## 对应原文的哪些做法

| 原文的做法 | 在这里怎么实现 |
|---|---|
| AI 先自己验证：跑测试、build、lint，并贴出结果 | CLAUDE.md 的「自检命令」、`/open-pr` 第 2 步、格式化钩子 |
| 用新的上下文审查一遍 diff | `/open-pr` 第 3、4 步调用的 code-review 和 security-review |
| 每个 PR 都有 AI 审查，对照整个仓库和 PR 意图 | `ai-review.yml` 里的 claude-review，还会对照 issue 验收标准和架构决策 |
| 问题分为 Important / Nit / Pre-existing，每条必须处理 | 审查提示词规定的标注，加上分支规则"评论线程必须全部处理完" |
| 安全审查，有问题就不能合并 | `security-review.yml`，加上同一条分支规则 |
| 必须通过的 CI | `ci.yml`、`commits.yml`，加上分支规则里的必需检查 |
| 风险由改动决定，不由作者决定 | `risk-rules.txt` 按路径定级，规则从目标分支读取 |
| 敏感路径和 CI 工作流一定要人看 | `.github/**` 等路径默认在 `[high]` 下 |
| 机器的批准不算人的批准 | 只认你亲手加的 `human-reviewed` 标签，AI 审查员没有加标签的权限 |
| 批准只对一次提交有效 | 有新提交时自动撤掉 `human-reviewed` |
| 限制审查轮数、之后只审新改动、不重复提 | 最多 3 轮；后续轮次只看新增提交；会先读已有评论 |
| 风险越高审得越深 | 审查深度随 `risk:*` 等级变化 |
| 用历史事故检验审查员 | `evals/` |
| 功能开关、逐步发布、一键回滚 | CLAUDE.md 的工作流程约定、PR 模板里的 How to revert、`/release` |

原文里的这些多人团队做法，这里没有照搬：两人审批（一个人做不到）、可信作者名单、合并队列（工作流已经支持 `merge_group`，需要时在 GitHub 上打开即可）、多个 AI 投票过滤误报、每晚扫描旧代码（需要的话可以用 `/schedule` 定时运行 `/code-review`）。

## format.config.json 的格式

```json
{
  "rules": [
    { "dir": "apps/web", "extensions": [".ts", ".html", ".scss"], "format": "npx prettier --write {file}", "lint": "npx eslint {file}" },
    { "dir": "apps/worker", "extensions": [".py"], "format": "uv run ruff format {file}", "lint": "uv run ruff check {file}" },
    { "dir": "apps/admin", "extensions": [".cs", ".razor"], "format": "dotnet format whitespace --folder --include {relfile}" }
  ]
}
```

- `dir`：规则管哪个目录，命令也在这个目录下运行。不写就是整个仓库。几条规则都匹配时，用目录最深的那条。
- `{file}` 会替换成刚改过的文件的绝对路径，`{relfile}` 会替换成相对 `dir` 的路径。
- format 失败时不拦截；lint 不通过时，会把错误交给 Claude 继续修。

## 提交信息格式

```
<类型>(<范围>): <描述> (#<issue 号>)

<可选的正文，说明为什么这样改>
```

类型可选：`feat` 新功能、`fix` 修 bug、`docs` 文档、`style` 格式、`refactor` 重构、`perf` 性能、`test` 测试、`build` 构建和依赖、`ci` CI 配置、`chore` 杂项、`revert` 撤回。破坏兼容的改动在类型后加 `!`，例如 `feat(api)!: 删除旧版接口`。`/release` 会根据这些类型决定下一个版本号。

## 费用

每个 PR，每轮会运行两次 Claude：一次代码审查，一次安全审查。用订阅令牌时消耗订阅额度，用 API key 时按量计费。草稿（draft）PR 不会触发审查。

另一个选择是 Anthropic 官方开源的安全审查 Action：`anthropics/claude-code-security-review`。它只支持 API key，误报过滤做得更细。想换的话，按它的说明替换 `security-review.yml`。

## 需要注意的地方

- 修改 `.github/workflows/` 下的文件时，那个 PR 上的 AI 审查可能会跑失败。`claude-code-action` 要求工作流文件和默认分支上的版本完全一致才会运行。这类 PR 本来就是高风险，需要你亲自看过再合并。
- 紧急情况必须直接推送时，到 GitHub 的 Settings → Rules 临时关掉规则，推完记得重新打开。
