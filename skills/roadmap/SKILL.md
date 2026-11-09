---
name: roadmap
description: 把 docs/product/ 的需求、docs/architecture/ 的架构（包括现代化的迁移步骤）和 docs/design/ 的设计（画面、数据、接口、逻辑，以及重新设计代码结构的方案）拆成里程碑和 GitHub issues：先排一个能端到端跑通、能部署的最小骨架，再按依赖和优先级排功能；拿不准的地方先排技术探针；每个 issue 都有类型、目标、对应的需求和设计、从设计里来的验收标准、涉及的组件、依赖和大小，用户确认后在 GitHub 上创建里程碑、标签和 issues，并写 docs/roadmap.md。在 /design 和 /scaffold 之后使用；/change 产生新工作时也会用它。完成后用 /implement 逐个开发。
---

# 拆计划

把需求和设计变成一个个能独立开发、独立审查、独立合并的 issue。每个 issue 对应一个 PR，PR 小，审查才审得仔细。issue 的内容从设计里来：做哪个画面、哪些接口、哪些规则，开发的人不用再猜。

## issue 类型

| 类型 | 标签 | 用途 |
|---|---|---|
| 功能 | `type:feature` | 用户能感知到的新行为 |
| 修复 | `type:bug` | 已有需求没被满足 |
| 重构 | `type:refactor` | 只调整结构、不改变行为，为后面的功能腾出位置 |
| 工程 | `type:chore` | 基础设施和工程类工作：部署流水线、日志、监控、数据库迁移框架 |
| 探针 | `type:spike` | 先验证再决定的问题，由 /spike 处理，产出 ADR，不产出正式代码 |

## 步骤

### 0. 读文档

读 CLAUDE.md、`docs/product/`、`docs/architecture/overview.md`、`docs/adr/`、`docs/design/`（`README.md` 的设计元素一览，以及画面、数据、接口、逻辑的定义；`refactor/` 下是重新设计代码结构的方案），以及已有的 `docs/roadmap.md` 和 GitHub 上已有的 issue（`gh issue list --state all --limit 200 --json number,title,state,milestone,labels`）。由 /change 调用时，只拆它交过来的那部分工作，不动已有的计划。

检查设计是否齐全：

- 本次要排的功能，在 `docs/design/README.md` 的需求覆盖表里找不到对应的设计元素时，告诉用户先运行 /design 补上，再回来拆。没有设计就拆出来的 issue，只能写到用户故事的粒度，开发时要靠猜。
- 状态为"AI 设计，待确认"的画面可以先拆 issue，但在 issue 里注明"开工前先请用户确认 SCR-xxx"，/implement 会在开工前检查。

### 1. 里程碑

新项目：

- **M0 走通骨架**：一条最薄的端到端路径穿过所有层（例如：页面上点一个按钮 → 调后端接口 → 写数据库 → 返回显示），本地用 docker compose 多实例跑起来，CI 全绿，并且能自动部署到测试环境、每个 PR 有预览地址（按架构文档选定的部署方式）。目的是尽早暴露集成和部署问题。
- **M1 MVP**：`docs/product/vision.md` 里第一版的全部需求。
- **M2 及以后**：按"以后再做"的需求分组。

现代化：每个里程碑对应 `docs/architecture/overview.md` 迁移步骤里的一步或几步，每个里程碑结束时系统都能正常上线运行。第一个里程碑通常是"给要动的部分补特征测试、接入规范和检查"。

状态为"提议"、等待验证的 ADR 和 `open-questions.md` 里标了需要验证的问题，各拆成一个 `type:spike` 的 issue，排在依赖它的工作前面。

### 2. 拆 issue

- 优先按"竖切"拆：一个 issue 完成一个用户能感知到的行为，前后端一起做；不按层横切（"先写完所有表""再写完所有接口"）。有画面的系统，一个 issue 通常是一个画面（或画面上的一组操作）加上它用到的接口和数据；没有画面的系统，一个 issue 通常是一个接口、一条命令或一个定时任务。
- 大小：S（改动大约 200 行以内）、M（大约 500 行以内）。估计超过 M 的继续拆，例如把一个画面的查询和编辑分开。
- 验收标准从设计里来：项目定义表里的每条校验规则、操作和事件表里每个操作的成功和失败、接口的每种错误、判定表的每一行。条目很多时，写"满足 SCR-xxx 项目定义表第 1 到 8 项的全部规则"这样的引用，并单独列出最重要的几条。
- 重新设计代码结构的方案（`docs/design/refactor/`）里的迁移步骤按它写的顺序拆：特征测试、重构、扩展、迁移、收缩、功能，各自成 issue。重构 issue 的验收标准是"行为不变"。
- 每个 issue 按 `templates/issue.md` 写：类型、目标、对应的需求和设计元素（REQ、SCR、ENT、API、JOB、LGC 编号，画面附上确认过的截图路径）、验收标准、涉及的组件、依赖哪些 issue、大小、预估风险等级（对照 `.github/risk-rules.txt`）、测试要点。

### 3. 排序和确认

按依赖关系排好顺序，用表格给用户看：编号、类型、标题、里程碑、对应的设计元素、大小、依赖。有取舍的地方（范围砍不砍、谁先做）用 AskUserQuestion 让用户选。

### 4. 在 GitHub 上创建

这一步会在用户的仓库里创建内容，先得到用户同意。

1. 标签：`type:feature`（`1d76db`）、`type:bug`（`d73a4a`）、`type:refactor`（`fbca04`）、`type:chore`（`c5def5`）、`type:spike`（`d4c5f9`）、`size:S`（`ededed`）、`size:M`（`bfdadc`），用 `gh label create <名称> --color <颜色> --force` 创建。
2. 里程碑：`gh api repos/{owner}/{repo}/milestones -f title="M0 走通骨架" -f description="<一句话>"`，已存在的跳过。
3. issue：按依赖顺序创建，先创建被依赖的，后面的 issue 正文里才能写上前面的编号。正文写到临时文件里，再用 `gh issue create --title "<标题>" --body-file <文件> --label <类型> --label <大小> --milestone "<里程碑>"` 创建。

### 5. 写 docs/roadmap.md

按 `templates/roadmap.md` 写，列出每个里程碑的目标和 issue 表格。进度以 GitHub 上 issue 的状态为准，roadmap.md 里不记进度。提交信息 `docs(roadmap): <内容>`，走 `docs/` 分支和 /open-pr。

### 6. 下一步

告诉用户：运行 `/implement next` 开始开发第一个 issue，或者 `/implement <issue 号>` 指定一个；排在最前面的是 `type:spike` 时，先运行 /spike。
