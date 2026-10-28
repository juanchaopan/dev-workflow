---
name: release
description: 发布一个版本：根据上次发布以来的 Conventional Commits 提交算出下一个语义化版本号，更新各组件的版本号和 CHANGELOG.md，按 CLAUDE.md 的分支策略走发布流程（Git Flow：develop → release/x.y.z → main → 打标签 → 合回 develop；GitHub Flow：在 main 上打标签），并创建 GitHub Release。也处理 Git Flow 下 hotfix 合入 main 之后的打标签和回合并。用户说"发布""发版""release""打个版本"时使用。
---

# 发布版本

## 步骤

### 0. 读策略和现状

- 读 CLAUDE.md「分支与提交」，确定是 GitHub Flow 还是 Git Flow；读「组件」一节，确定有哪些组件。各组件的版本号放在哪里，见 scaffold 规范库里对应技术栈 `stack.md` 的"版本号"一节（与本技能同级的 `scaffold/stacks/`）。
- `git fetch origin --tags`，找出上一个版本标签：`git describe --tags --abbrev=0 origin/main`（还没有标签时，上一版当作 0.0.0，从第一个提交算起）。
- 有没有合并到 main、但还没打标签的 hotfix：有的话，走下面的"hotfix 收尾"。

### 1. 算版本号

列出上一个标签以来要发布的提交（Git Flow 看 `<上个标签>..origin/develop`，GitHub Flow 看 `<上个标签>..origin/main`），按类型分组。按语义化版本的规则：

- 有破坏兼容的改动（类型后带 `!`，或正文里有 `BREAKING CHANGE:`）→ 主版本号加 1
- 有 `feat` → 次版本号加 1
- 只有 `fix`、`perf` 等 → 修订号加 1
- 主版本号是 0 时，破坏兼容的改动只加次版本号

把版本号、要发布的改动摘要给用户看，用 AskUserQuestion 确认版本号（推荐项是你算出来的那个）。

### 2. 准备发布内容

1. 更新 `CHANGELOG.md`（不存在就新建）：在最上面加一节 `## <版本号>（<日期>）`，按"新功能""修复""性能""破坏兼容的改动"分组列出改动，每条带 PR 或 issue 编号。文档、CI、杂项类提交不列出来。
2. 按各技术栈的方法更新每个组件的版本号。
3. 运行全部自检命令。

### 3a. Git Flow

1. 从 develop 拉出 `release/<版本号>`，提交上面的改动：`chore(release): <版本号>`，推送。
2. 创建 PR：`gh pr create --base main --head release/<版本号> --title "chore(release): <版本号>"`，正文写上本次发布的 CHANGELOG 内容和回滚方法（回到上一个标签重新部署）。开启自动合并 `gh pr merge --auto --merge`。
3. 告诉用户：发布 PR 一律是高风险，不会再做 AI 审查（里面的代码在合入 develop 时都审过了），请他确认要发布后加 `human-reviewed` 标签。
4. 合并后：在 main 的合并提交上打标签并推送：`git fetch origin && git tag -a v<版本号> origin/main -m "v<版本号>" && git push origin v<版本号>`。
5. 回合并：`gh pr create --base develop --head main --title "chore(release): 合回 v<版本号>"`，开启自动合并。这类 PR 算低风险，检查通过后会自动合并。

### 3b. GitHub Flow

1. 从 main 拉出 `chore/release-<版本号>` 分支，提交 `chore(release): <版本号>`，用 /open-pr 合并。
2. 合并后在 main 上打标签并推送：`git fetch origin && git tag -a v<版本号> origin/main -m "v<版本号>" && git push origin v<版本号>`。

### 4. GitHub Release

`gh release create v<版本号> --title "v<版本号>" --notes-file <这次的 CHANGELOG 内容>`。仓库里有监听版本标签的部署工作流时，告诉用户部署已经开始，以及去哪里看进度。

### hotfix 收尾（Git Flow）

线上紧急问题用 `/implement` 修：从 main 拉 `hotfix/<版本号>`，PR 合入 main。合并之后运行 /release：

1. 版本号是上个标签的修订号加 1。
2. CHANGELOG 和版本号的改动在 hotfix 分支上一起提交；已经合并了的，就从 main 拉 `hotfix/<版本号>-release` 补一个 PR。
3. 在 main 上打标签、创建 GitHub Release（同 3a 第 4 步、第 4 步）。
4. 回合并到 develop（同 3a 第 5 步）。有冲突时，在本地从 develop 拉出分支，合并 main 并解决冲突，再开 PR 合回 develop。

### 5. 汇报

说明发布了哪个版本、包含哪些改动、标签和 Release 链接，以及还有什么要用户做的（例如手动部署）。
