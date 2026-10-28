# dev-workflow：通用的 AI 开发流程

一套 Claude Code 插件，把一个项目从"有个想法"（或者"接手一堆旧代码"）一路带到需求、架构、项目骨架、计划，再到一个个功能的开发、审查、合并和发布。适合个人开发者和小团队，任何技术栈的新项目和已有项目都能用。

各个技能之间不靠对话记忆交接，而是靠写进项目仓库的文档：`docs/`（需求、架构、设计、决策、路线图）和 `CLAUDE.md`（组件、命令、规范、分支策略）。今天聊的和三个月后聊的，AI 读到的是同一份"项目真相"。

## 安装

**在自己的电脑上**：这个文件夹放在 `~/.claude/skills/dev-workflow/` 下，Claude Code 会自动把它当作插件加载（`claude plugin list` 里显示为 `dev-workflow@skills-dir`）。

**给别人用**：把这个文件夹推到一个 GitHub 仓库，别人在 Claude Code 里运行：

```
/plugin marketplace add <你的 GitHub 用户名>/<仓库名>
/plugin install dev-workflow@dev-workflow
```

更新时运行 `/plugin marketplace update dev-workflow`。

在 Claude Code 里输入 `/kickoff`、`/implement` 这样的命令就能使用；和别的插件重名时，加上插件名：`/dev-workflow:kickoff`。不输入命令时，Claude 也会根据你说的话自动选用合适的技能。每次会话开始时，插件会加载各技能的简介，大约占用 2600 个 token。

## 流程

```
新项目：
  /kickoff ──► /architect ──► /scaffold ──► /roadmap ──► /implement next（循环）──► /release
  需求挖掘      选型+架构       搭项目+规范      拆 issue       开发→PR→审查→合并         发布版本
                               +/setup-ai-review

已有项目：
  /onboard ──► （只维护）/change、/implement
          └──► （加功能、现代化）/kickoff ──► /architect（目标架构+迁移步骤）──► /roadmap ──► /implement

之后每个新想法或新 issue：
  /change ──► 按需求级别（L0–L4）和设计冲击（D0–D2）处理 ──► 拆 issue ──► /implement

拿不准的时候（任何阶段）：
  /spike ──► 限时验证 ──► 证据给你看 ──► 你拍板 ──► 写成 ADR ──► 正式实现
```

| 技能 | 做什么 | 你要做的 |
|---|---|---|
| `/kickoff` | 从点子、已有代码、文档或问题出发，分几轮问选择题，找出逻辑漏洞，写需求文档 | 回答问题；确认需求 |
| `/onboard` | 接手已有项目：盘点、整理现状架构、推断已有功能、量出质量基线，用基线方式接入规范 | 确认推断的内容；说想做什么 |
| `/architect` | 架构指标、逐层选型、每个技术栈的细节决策（例如 Maven 还是 Gradle）、部署和 PR 预览、视觉验证、分布式设计、迁移方案 | 选技术；确认架构 |
| `/spike` | 限时的技术探针：定问题和判据，做最小实现，拿出证据，结论写成 ADR，丢掉代码 | 试用、拍板 |
| `/scaffold` | 用官方生成器建组件，装代码规范和架构检查，写 docker compose 和部署流水线，建仓库，装审查流程 | 确认目录结构；注册部署平台 |
| `/setup-ai-review` | CI、AI 代码审查、安全审查、风险分级、提交信息检查、重复代码检查、依赖自动升级、`@claude` | 选分支策略；放密钥 |
| `/roadmap` | 拆里程碑和 issue，每个 issue 一个小 PR；先排探针和骨架 | 确认范围和顺序 |
| `/implement` | 开分支，必要时先重构，"测试 → 实现 → 重构"小步提交，开 PR，处理审查意见，自动合并 | 中、高风险 PR 读 diff 后加 `human-reviewed` 标签 |
| `/change` | 给新想法定两个级别：需求变了多少、对现有设计冲击多大；补问、改文档、写设计文档、拆 issue | 确认级别；回答补问 |
| `/release` | 算版本号、写 CHANGELOG、走发布分支、打标签、创建 Release、跟进生产部署 | 确认版本号；批准生产部署 |

## 你在哪些地方介入

1. **回答问题和做选择**：/kickoff、/architect、/change、/spike 会问你，选项里带推荐。
2. **确认文档**：需求、架构、设计、计划写完后给你过目。
3. **验证探针**：打开地址试一试、看证据，决定采用还是放弃。
4. **中、高风险 PR**：亲自读 diff，确认后加 `human-reviewed` 标签。低风险的自动合并。
5. **发布**：确认版本号，给发布 PR 加 `human-reviewed` 标签，批准生产部署。
6. **AI 不确定的时候**：业务规则、架构、设计上没写清楚的地方，AI 会停下来问你，不会自己拍板。

## 常见场景

**有新想法**：在 Claude Code 里说 `/change 我想让用户可以导出订单`。它会定级、补问、改文档、拆 issue，然后 `/implement <issue 号>`。也可以先在 GitHub 网站或手机上用"新功能"模板记一个 issue，回到电脑上运行 `/change #45`。描述清楚的小改动，可以直接在 issue 里评论 `@claude 实现这个`，在云端完成。

**一个想法会大改现有的类和接口**：/change 会判定为 D2，先写 `docs/design/` 下的设计文档给你确认，再拆成"特征测试 → 重构 → 扩展新接口 → 迁移调用方 → 删除旧接口 → 加功能"一串小 PR，每一步都能单独上线。

**复杂、拿不准的想法**：/kickoff、/architect、/change 会建议先 /spike。界面类的探针会给你一个能打开的地址（本地，或者 PR 预览环境），你亲自试过再决定；探针代码不进正式分支，结论写进 ADR，然后按正式流程重新实现。

**接手老项目、要现代化**：/onboard 先只读不改，整理现状、量出基线；然后 /kickoff（已有代码入口）问清为什么要动、要达到什么、保留什么；/architect 设计目标架构和可以逐步上线的迁移步骤（例如绞杀者模式）；/roadmap 按迁移步骤拆 issue。

## 代码规范从哪来

`skills/scaffold/stacks/` 是规范库，每个技术栈一套，分三部分：

| 部分 | 内容 | 谁来执行 |
|---|---|---|
| 工具检查 | lint、格式化、复杂度和函数长度上限：Angular 用 angular-eslint 加 Prettier，Spring Boot 用 Spotless 加 Checkstyle 加 PMD，Python 用 ruff 加 mypy，React 用 oxlint 加 Prettier，Node.js 用 typescript-eslint 加 Prettier，.NET 用 `.editorconfig` 加 `dotnet format` 加分析器 | 格式化钩子（每改一个文件就跑）和 CI |
| 架构检查 | 分层规则：前端的页面（容器）和展示组件分开、展示组件不能调 API；后端的 controller → service → repository；领域层不依赖框架；功能之间不互相引用；没有循环依赖。Angular、React、Node.js 用 dependency-cruiser，Spring Boot 用 ArchUnit，Python 用 import-linter，.NET 用 ArchUnitNET | 自检命令和 CI，违反就失败 |
| 判断型规范 | `rules.md`：从官方风格指南、Google 风格指南、阿里巴巴 Java 开发手册、微软编码约定和通行的分层做法里，整理出工具查不出来的要点 | 装到项目的 `.claude/rules/`，Claude 改到对应目录时自动读取，AI 审查员也对照着审 |

每个技术栈的 `stack.md` 还列出了"决策点"（例如构建工具、状态管理、数据访问方式），/architect 会逐个问你，不写死。要加新的技术栈，照着任意一个目录的结构写一套：`stack.md`、`rules.md`、`files/`，再加一个 `tests/stacks/<技术栈>.sh` 冒烟测试。

## 防止代码越改越像补丁

| 环节 | 做法 |
|---|---|
| 设计 | /change 的设计冲击评估：现有结构放不下时，先写设计文档、先重构，再加功能 |
| 写代码 | 项目 CLAUDE.md「写代码的方式」；/implement 每一步都是"测试 → 实现 → 重构" |
| 写完 | /open-pr 先跑一轮 `simplify` 简化审查 |
| 审查 | REVIEW.md「补丁味和臃肿」，AI 审查员专门查 |
| 机器检查 | 复杂度和长度上限、jscpd 重复代码检查、架构检查；lint 和架构检查的配置文件改动一律算高风险，防止"放宽规则来迁就代码" |

## 视觉和布局

有设计稿时，设计稿是标准答案（Figma 可以通过它的 MCP 服务让 Claude 直接读取）。颜色、字号、间距统一成设计令牌；展示组件在 Storybook 里逐个检查；视觉回归测试用 Playwright 截图对比，外观有意外变化时 PR 会失败并给出对比图。说明见 `skills/scaffold/shared/visual-testing.md`。

## 维护和升级

工具和生成器大约每几个月就会变一次（例如 create-vite 从 ESLint 换成了 oxlint、TypeScript 7 发布后周边工具还没跟上、PMD 给规则改了名）。这个插件自带体检：

```
node --test "tests/*.test.mjs"            # 装进项目的那些脚本的单元测试，几秒钟
bash tests/stacks/<技术栈>.sh              # 某个技术栈的冒烟测试，真建一个项目，几分钟
BUILD_TOOL=gradle bash tests/stacks/spring-boot.sh
```

仓库推到 GitHub 后，`.github/workflows/self-test.yml` 每周一自动跑一遍全部技术栈，失败时开一个 issue。修的时候在 Claude Code 里说明哪个技术栈坏了、贴上日志，让它更新对应的 `stack.md` 和配置，再跑一遍冒烟测试确认。

项目里的依赖由各项目自己的 Dependabot 每周检查升级。

改了插件以后，按 Conventional Commits 提交，并把 `.claude-plugin/plugin.json` 的版本号按语义化版本加一。

## 没有自动验证的部分

下面这些写进了文档和模板，但需要真实的账号或环境，没有在冒烟测试里跑过，第一次用时留意：

- 部署流水线（`skills/scaffold/shared/deploy.yml`）和各部署平台的 PR 预览。
- 视觉回归测试在 Docker 里生成基准截图的命令（需要 Docker Desktop 在运行）。
- GitHub 上的工作流：AI 审查、安全审查、`@claude`、Dependabot、分支规则。它们只有在真实的仓库里才能跑。
