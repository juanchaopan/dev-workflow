---
name: scaffold
description: 按 docs/architecture/ 的设计搭建项目：用各技术栈的官方生成器创建每个组件，按架构文档选定的决策点装上规范库里对应技术栈的代码规范、架构检查（分层规则由工具强制）、lint 和格式化配置，需要时装上 Storybook 和视觉回归测试；生成本地用 docker compose 跑多实例的配置和部署流水线（测试环境、生产环境、PR 预览）；建 GitHub 仓库，最后调用 /setup-ai-review 装上审查流程。也能给已有项目补装某个技术栈的规范，现存问题用基线记下、不阻塞。规范库现有 Angular、Spring Boot（Maven 或 Gradle）、Python、React（TypeScript）、Node.js（TypeScript）、.NET Blazor。在 /architect 之后使用，完成后接 /roadmap。
---

# 搭建项目

本技能目录（加载技能时显示的 Base directory）里有：

- `stacks/<技术栈>/`：规范库，每个技术栈一个目录。
  - `stack.md`：怎么识别、需要哪些工具、决策点、怎么创建、创建后装哪些规范和检查、自检命令、格式化钩子规则、CI 步骤、版本号放在哪、参考资料。
  - `rules.md`：给 AI 看的代码规范，包括分层规则，复制到项目的 `.claude/rules/`。
  - `files/`：lint、格式化和架构检查的配置，复制到组件目录。
- `shared/`：几个技术栈共用的东西。
  - `arch-check.mjs`：dependency-cruiser 的包装脚本（Angular、React、Node 用）。
  - `visual-testing.md`、`playwright.config.ts`：设计令牌、Storybook、视觉回归测试。
  - `deployment.md`、`deploy.yml`：环境、部署平台、PR 预览和部署流水线。
- `common/`：每个项目根目录都要有的文件（`.editorconfig`、`.gitattributes`、`.gitignore`、新功能 issue 模板）。

## 两种用法

- **新项目**：做第 0 到 10 步。
- **给已有项目装规范**（用户直接要求，或 /onboard 调用）：做第 0、4、5、10 步。识别技术栈用各 `stack.md` 里的"识别方法"。配置文件已经存在时，不要覆盖：比较差异，告诉用户打算怎么合并，同意后再改。目录结构和规范库的分层约定对不上时，不要大规模搬动代码；先只装工具和规则，现存的违规按 onboard 技能第 7 步的方法记成基线。改动通过分支和 /open-pr 提交。

## 步骤

### 0. 读设计

读 `docs/architecture/overview.md` 和 `docs/adr/`，列出每个组件：名称、目录、技术栈、版本，以及 ADR 里记下的决策点结果（构建工具、数据访问方式、组件分层、是否用 Storybook 和视觉回归测试等）、部署方式。没有架构文档就告诉用户先运行 /architect。某个决策点 ADR 里没写时，按 `stack.md` 决策点表里的推荐项问用户。组件的技术栈在规范库里没有时，告诉用户：可以照常创建，但需要另外补一套规范（照着 `stacks/` 里的某个目录写一套新的，至少包括 lint、格式化和架构检查）。

### 1. 确认目录结构

单仓库多组件的默认结构：

```
<项目>/
├── apps/<组件>/      每个能独立部署的组件
├── libs/<名称>/      组件之间共享的代码（需要时才建）
├── infra/            docker-compose.yml、部署配置
├── docs/             需求、架构、设计、决策、路线图
├── .claude/rules/    各组件的代码规范
└── .github/          CI、审查、部署、模板
```

只有一个组件时，可以直接放在仓库根目录。把目录树给用户看，确认后再创建。

### 2. 检查工具

按各技术栈 `stack.md` 的"需要的工具"逐个检查，例如运行 `node --version`、`java --version`、`dotnet --version`、`uv --version`、`docker --version`。缺少的工具告诉用户怎么装，不要自己装系统级软件。

### 3. 创建组件

对每个组件，按 `stack.md` 的"创建命令"在组件目录里生成项目。用官方生成器，不要手写项目骨架。生成器有交互提问时，用参数给出答案，或者照默认值走。

### 4. 装规范和检查

对每个组件，按 `stack.md` 的"创建后"一节做完每一步，按决策点的结果选择对应的分支（例如 Maven 或 Gradle）。这一节包括：

- lint、格式化、复杂度和长度上限的配置；
- 架构检查（dependency-cruiser、ArchUnit、import-linter 或 ArchUnitNET），以及 `rules.md` 约定的分层目录；
- 把 `rules.md` 复制为 `.claude/rules/<组件名>.md`，把 frontmatter 里 `paths` 的占位符换成组件目录，把正文里的组件名、包名等占位符填好；
- 决策点选了 Storybook、视觉回归测试时，按 `stack.md` 的"可选"小节和 `shared/visual-testing.md` 装上；
- 设计令牌（有前端时）：建 `src/styles/tokens.(s)css`，有设计稿时按设计稿填，没有时先放一套基础的颜色、字号、间距。

最后在组件目录下依次运行 `stack.md` 的全部自检命令，必须全部通过。生成器自带的代码不符合规范时（包括架构检查和复杂度上限），修到符合为止，不要放宽规则。

### 5. 根目录通用文件

把 `common/` 下的文件复制到仓库根目录，已有的文件按内容合并。`.gitignore` 里保留生成器在各组件目录生成的 `.gitignore`，根目录只放通用的条目。

### 6. 本地运行环境

按架构文档的部署设计写 `infra/docker-compose.yml`：

- 每个组件一个服务，用组件目录下的 Dockerfile 构建（按技术栈的常规做法写多阶段构建的 Dockerfile）。
- 无状态组件按部署设计设置多个实例（`deploy.replicas`），前面放一个反向代理做负载均衡，这样本地就能看到多实例的效果。
- 数据库、缓存、消息队列等依赖用官方镜像，数据放在命名卷里。
- 每个服务配健康检查，依赖关系用 `depends_on` 加 `condition: service_healthy`。
- 配置通过环境变量传入，示例值放在 `infra/.env.example`，真正的 `.env` 不提交。

运行 `docker compose -f infra/docker-compose.yml config` 检查配置。问用户要不要现在启动试一下。

### 7. 部署流水线

按架构文档选定的部署方式和 `shared/deployment.md`：

- 需要工作流的平台：按 `shared/deploy.yml` 写 `.github/workflows/deploy.yml`，填好集成分支（Git Flow 是 develop，GitHub Flow 是 main）、组件列表和平台的部署步骤。
- 自带 Git 集成的平台（例如静态托管平台）：不写工作流，把需要在平台网站上做的配置（连接仓库、组件目录、构建命令、哪个分支部署到哪个环境、PR 预览）列给用户。
- 列出用户要自己做的事：注册平台账号、在 GitHub 上建 `staging` 和 `production` 两个 environment、给 `production` 设 Required reviewers、把平台令牌存成 environment secret。

### 8. 提交

按 Conventional Commits 分成多个提交，每个提交只做一件事，例如：

- `chore: 初始化仓库结构`
- `feat(<组件>): 用 <生成器> 生成 <技术栈> 骨架`（每个组件一个）
- `build(<组件>): 加入代码规范、架构检查和 lint 配置`（每个组件一个）
- `build(infra): 加入本地 docker compose 环境`
- `ci: 加入部署流水线`

仓库里已经有 /kickoff 和 /architect 写的文档提交时，保留它们。

### 9. GitHub 仓库

问用户：仓库公开还是私有（私有仓库在 GitHub 免费版上用不了分支规则和生产环境的人工批准，流程只能靠自觉执行），仓库名用什么。得到同意后运行 `gh repo create <名称> --<public 或 private> --source . --push`。

### 10. 装审查流程

用 Skill 工具运行 `setup-ai-review`。告诉它：这是 /scaffold 刚搭出来（或刚装好规范）的项目，组件、目录、自检命令和 CI 步骤都在各技术栈的 `stack.md` 里，`.claude/hooks/format.config.json` 按各 `stack.md` 的"格式化钩子规则"写，每条规则的 `dir` 填组件目录；Dependabot 按每个组件的包管理器配置。

### 11. 汇报和下一步

汇报：建了哪些组件、各装了哪套规范和哪些检查、决策点的结果、自检结果、本地怎么启动、部署流水线和用户还要做的平台配置、仓库地址。告诉用户接下来运行 /roadmap，把需求拆成 issue。
