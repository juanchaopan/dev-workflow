# AI 开发流程总览

这个目录下的几个技能连成一条完整的开发流程：从一个模糊的想法，到需求、架构、项目骨架、计划，再到一个个 feature 的开发、审查、合并和发布。每个技能负责一段，彼此之间不靠对话记忆交接，而是靠写进项目仓库的文档：`docs/`（需求、架构、决策、路线图）和 `CLAUDE.md`（组件、命令、分支策略）。

## 流程

```
新项目：
  /kickoff ──► /architect ──► /scaffold ──► /roadmap ──► /implement next（循环）──► /release
  需求挖掘      选型+架构       搭项目+装规范     拆 issue        开发→PR→审查→合并         发布版本
                               +/setup-ai-review

之后每个新想法或新 issue：
  /change ──► （L0/L1）/implement
         └──► （L2/L3）更新需求 ──►（必要时）/architect ──► 拆 issue ──► /implement
         └──► （L4）/architect 写新 ADR 和迁移步骤 ──► 拆 issue ──► /implement
```

| 技能 | 做什么 | 产出 | 你要做的 |
|---|---|---|---|
| `/kickoff` | 分几轮问选择题，弄清目标、用户、场景、规则、边界、规模、范围，找出逻辑漏洞 | `docs/product/` | 回答问题；确认需求文档 |
| `/architect` | 把需求换算成架构指标，逐层对比候选技术，设计分层、组件、部署、数据、故障处理，检查架构漏洞 | `docs/architecture/overview.md`、`docs/adr/` | 选技术；确认架构 |
| `/scaffold` | 用官方生成器建每个组件，装代码规范，写 docker compose，建 GitHub 仓库，装审查流程 | 项目骨架、`.claude/rules/`、lint 配置 | 确认目录结构；选公开或私有；在 GitHub 上放密钥 |
| `/setup-ai-review` | CI、AI 代码审查、安全审查、风险分级、提交信息检查、分支规则 | `.github/`、`CLAUDE.md`、`REVIEW.md` | 选分支策略；确认 GitHub 设置 |
| `/roadmap` | 拆里程碑和 issue，每个 issue 一个小 PR | GitHub issues、`docs/roadmap.md` | 确认范围和顺序 |
| `/implement` | 开分支，小步实现、测试、提交，开 PR，处理审查意见，自动合并 | 代码和 PR | 中、高风险 PR 读 diff 后加 `human-reviewed` 标签 |
| `/change` | 给新想法定级（L0 到 L4），补问、更新文档、拆 issue | 更新的文档、变更记录、issue | 确认级别；回答补问 |
| `/release` | 算版本号，写 CHANGELOG，走发布分支，打标签，创建 Release | 版本标签、Release | 确认版本号；确认发布 |

## 你在哪些地方介入

1. **回答问题和做选择**：/kickoff、/architect、/change 会问你，选项里带推荐。
2. **确认文档**：需求、架构、计划写完后给你过目。
3. **中、高风险 PR**：亲自读 diff，确认后加 `human-reviewed` 标签。低风险的自动合并。
4. **发布**：确认版本号，给发布 PR 加 `human-reviewed` 标签。
5. **AI 不确定的时候**：业务规则或架构上没写清楚的地方，AI 会停下来问你，不会自己拍板。

## 代码规范从哪来

`/scaffold` 的规范库（`scaffold/stacks/`）为每个技术栈准备了两部分：

- **能用工具检查的**：业界通用的 lint 和格式化工具配置。Angular 用 angular-eslint 加 Prettier，Spring Boot 用 Spotless（google-java-format）加 Checkstyle 加 PMD，Python 用 ruff 加 mypy，React 和 Node.js 用 typescript-eslint 加 Prettier，.NET 用 `.editorconfig` 加 `dotnet format` 加分析器。它们由格式化钩子（Claude 每改一个文件就跑）和 CI（合并前必须过）执行。
- **需要判断的**：`rules.md`，从官方风格指南、Google 风格指南、阿里巴巴 Java 开发手册、微软编码约定里挑出工具查不出来的要点。装到项目的 `.claude/rules/` 后，Claude 改到对应目录的文件时会自动读取，AI 审查员也会对照着审。

要加新的技术栈，照着 `scaffold/stacks/` 下任意一个目录的结构写一套：`stack.md`、`rules.md`、`files/`。

## 项目里的文档地图

```
<项目>/
├── CLAUDE.md                  组件、自检命令、规范入口、分支与提交规则
├── REVIEW.md                  AI 审查标准
├── CHANGELOG.md               版本记录（/release 维护）
├── .claude/rules/             各组件的代码规范
└── docs/
    ├── README.md              文档索引
    ├── product/               愿景、需求、术语、未决问题
    ├── architecture/          架构总览
    ├── adr/                   架构决策记录
    ├── roadmap.md             里程碑和 issue
    └── changes/               较大变更的记录
```
