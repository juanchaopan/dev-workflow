---
name: roadmap
description: 把 docs/product/ 的需求和 docs/architecture/ 的架构拆成里程碑和 GitHub issues：先排一个能端到端跑通的最小骨架，再按依赖和优先级排功能；每个 issue 都有目标、对应需求、验收标准、涉及的组件、依赖和大小，用户确认后在 GitHub 上创建里程碑、标签和 issues，并写 docs/roadmap.md。在 /scaffold 之后使用；/change 产生新工作时也会用它。完成后用 /implement 逐个开发。
---

# 拆计划

把需求变成一个个能独立开发、独立审查、独立合并的 issue。每个 issue 对应一个 PR，PR 小，审查才审得仔细。

## 步骤

### 0. 读文档

读 CLAUDE.md、`docs/product/`、`docs/architecture/overview.md`、`docs/adr/`，以及已有的 `docs/roadmap.md` 和 GitHub 上已有的 issue（`gh issue list --state all --limit 200 --json number,title,state,milestone,labels`）。由 /change 调用时，只拆它交过来的那部分工作，不动已有的计划。

### 1. 里程碑

- **M0 走通骨架**：一条最薄的端到端路径穿过所有层（例如：页面上点一个按钮 → 调后端接口 → 写数据库 → 返回显示），用 docker compose 在本地多实例跑起来，CI 全绿。目的是尽早暴露集成问题。
- **M1 MVP**：`docs/product/vision.md` 里第一版的全部需求。
- **M2 及以后**：按"以后再做"的需求分组。

### 2. 拆 issue

- 优先按"竖切"拆：一个 issue 完成一个用户能感知到的行为，前后端一起做；不按层横切（"先写完所有表""再写完所有接口"）。
- 大小：S（改动大约 200 行以内）、M（大约 500 行以内）。估计超过 M 的继续拆。
- 每个 issue 按 `templates/issue.md` 写：目标、对应需求（REQ 编号）、验收标准（从需求里抄过来，并细化到这个 issue 的范围）、涉及的组件、依赖哪些 issue、大小、预估风险等级（对照 `.github/risk-rules.txt`）、测试要点。
- 基础设施和工程类工作（日志、监控、部署流水线、数据库迁移框架）也要拆成 issue，类型标为 chore，放进最早需要它们的里程碑。

### 3. 排序和确认

按依赖关系排好顺序，用表格给用户看：编号、标题、里程碑、大小、依赖。有取舍的地方（范围砍不砍、谁先做）用 AskUserQuestion 让用户选。

### 4. 在 GitHub 上创建

这一步会在用户的仓库里创建内容，先得到用户同意。

1. 标签：`gh label create type:feature --color 1d76db --force`、`type:bug`（`d73a4a`）、`type:chore`（`c5def5`）、`size:S`（`ededed`）、`size:M`（`bfdadc`）。
2. 里程碑：`gh api repos/{owner}/{repo}/milestones -f title="M0 走通骨架" -f description="<一句话>"`，已存在的跳过。
3. issue：按依赖顺序创建，先创建被依赖的，后面的 issue 正文里才能写上前面的编号。正文写到临时文件里，再用 `gh issue create --title "<标题>" --body-file <文件> --label type:feature --label size:S --milestone "<里程碑>"` 创建。

### 5. 写 docs/roadmap.md

按 `templates/roadmap.md` 写，列出每个里程碑的目标和 issue 表格。进度以 GitHub 上 issue 的状态为准，roadmap.md 里不记进度。提交信息 `docs(roadmap): <内容>`，走 `docs/` 分支和 /open-pr。

### 6. 下一步

告诉用户：运行 `/implement next` 开始开发第一个 issue，或者 `/implement <issue 号>` 指定一个。
