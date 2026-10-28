---
name: setup-ai-review
description: 给一个 GitHub 仓库装上"AI 写代码、AI 先审、人按风险把关"的整套代码审查流程（参照 Claude Code 团队的代码审查做法，面向一个人开发的项目）：复制通用模板，按项目实际情况填写 CLAUDE.md、REVIEW.md、CI、格式化钩子和风险规则，配置分支策略（GitHub Flow 或 Git Flow）和提交信息检查，再带用户完成 GitHub 上的密钥和分支规则设置。用户说"装审查流程""给项目加代码审查""setup ai review""审核 AI 写的代码"时使用；/scaffold 搭完新项目后也会调用它。
---

# 安装 AI 代码审查流程

本技能目录（加载技能时显示的 Base directory）里有：

- `template/`：复制进项目的文件。分两种：通用文件原样使用；项目专属文件带 `{{…}}` 占位符或"项目专属"区段，需要按项目填写。
- `install.mjs`：把 `template/` 复制到目标仓库，目标里已有的同名文件一律跳过。
- `github-settings/ruleset.json`：受保护分支的规则，通过 GitHub API 创建。
- `README.md`：给用户看的说明，解释每个文件的作用。用户问"这是什么""为什么要这样"时参考它。

按下面的顺序做。每一步完成后用一两句话告诉用户做了什么。

## 1. 确认目标仓库

- 运行 `git rev-parse --show-toplevel`。当前目录不是 git 仓库时，问用户要装到哪个项目。
- 运行 `gh repo view --json nameWithOwner,defaultBranchRef,visibility,isPrivate`。没有 GitHub 远端时，告诉用户需要先在 GitHub 上建仓库并推送，问要不要现在做，不要自己建。
- 工作区有未提交的改动时，先问用户怎么处理。

## 2. 复制模板

运行 `node "<本技能目录>/install.mjs" "<仓库根目录>"`。记下输出里的 `copied` 和 `skipped`。

## 3. 了解项目

读 README、依赖清单（package.json、pyproject.toml、pom.xml、*.csproj、go.mod 等）、已有的 CI 配置和目录结构，弄清有哪些组件，每个组件用什么语言、框架、包管理器，格式化、lint、类型检查、测试、构建各用什么命令。项目是 /scaffold 刚搭出来的，就直接用 scaffold 规范库里各技术栈 `stack.md` 给出的命令。

项目的技术栈在 scaffold 规范库（与本技能同级的 `scaffold/stacks/`）里有对应、但还没装规范时，告诉用户可以运行 /scaffold 给现有项目装上。

## 4. 选分支策略

用 AskUserQuestion 让用户选（CLAUDE.md 里已经写明的就不用再问）：

- **GitHub Flow**（一个人开发推荐）：从 main 拉 `feature/`、`fix/` 分支，PR 合回 main；发布就是在 main 上打版本标签。
- **Git Flow**：develop 是默认分支，`feature/`、`fix/` 从 develop 拉、PR 合回 develop；发布时从 develop 拉 `release/<版本号>`，PR 合入 main 并打标签，再把 main 合回 develop；线上紧急问题从 main 拉 `hotfix/<版本号>`，PR 合入 main，同样合回 develop。

把选中策略的那段说明写进 CLAUDE.md「分支与提交」一节。

## 5. 填写项目专属文件

每个文件整体重写，删掉所有 `{{…}}` 占位符。推断不出来的内容问用户，不要编造；不适用的条目整行删掉。

| 文件 | 怎么填 |
|---|---|
| `CLAUDE.md` | 项目简介、组件表、每个组件的自检命令、代码规范、目标与非目标、分支与提交。自检命令要在本地真跑一次，确认能用。保持简短，长内容链接到 docs/ |
| `REVIEW.md` | 按项目类型推断"什么算坏"、重点检查项和跳过的路径，写完给用户看并确认。评论语言用用户和你对话时用的语言 |
| `.github/workflows/ci.yml` | 把"项目专属"区段换成每个组件的安装、lint、类型检查、测试、构建步骤，命令和 CLAUDE.md 一致。组件多时，每个组件一个 job，再保留一个名为 `ci` 的汇总 job（`needs` 全部组件 job，`if: always()`，任何一个失败就失败），分支规则靠 `ci` 这个名字识别 |
| `.claude/hooks/format.config.json` | 只给已经装好的格式化和 lint 工具加规则，先运行一次确认命令存在。每条规则用 `dir` 指定组件目录。格式见 README |
| `.github/risk-rules.txt` | 按项目的目录结构调整 `[high]` 和 `[low]`：登录鉴权、付款、数据迁移、发布和安装脚本、CI 配置放 `[high]`；纯文档放 `[low]` |

`skipped` 里的文件是项目原来就有的：读原文件，找出模板里有而原文件缺的部分，把打算怎么合并告诉用户，用户同意后整体重写那个文件。项目已有的 `CLAUDE.md` 尤其要保留原有内容。

## 6. 本地验证

- `node --check` 检查 `.claude/hooks/format.mjs`、`.github/scripts/risk-classify.mjs`、`.github/scripts/check-commit-message.mjs`、`evals/run-review-evals.mjs`。
- 拿项目里一个真实文件试格式化钩子：`echo '{"tool_input":{"file_path":"<文件绝对路径>"}}' | node .claude/hooks/format.mjs`，退出码应为 0。
- 拿几组路径试风险规则：`node .github/scripts/risk-classify.mjs --dry-run README.md <某个源码文件> .github/workflows/ci.yml`，确认等级符合预期。
- 启用提交信息检查：`git config core.hooksPath .githooks`，并运行 `git update-index --chmod=+x .githooks/commit-msg`，让 macOS 和 Linux 上克隆的仓库也能执行这个钩子。拿一句不合格的提交信息试一下：`echo "随便改改" > "$TMPDIR/msg" && node .github/scripts/check-commit-message.mjs --file "$TMPDIR/msg"`，应该报错。
- 运行 CLAUDE.md 里的全部自检命令。

## 7. 提交并推送

征得用户同意后，按 Conventional Commits 把文件分成几个提交（例如 `ci: 加入 AI 审查和安全审查`、`chore: 加入提交信息检查`、`docs: 加入 CLAUDE.md 和 REVIEW.md`），直接推到当前默认分支。这时分支规则还没打开，可以直接推；而且 `claude-code-action` 要求工作流文件在默认分支上已存在且内容相同才会运行。

选了 Git Flow 时：确认 main 上已经有这些提交，再从 main 拉出 develop 并推送，然后 `gh repo edit --default-branch develop`。

## 8. GitHub 设置

这些操作会改动用户的 GitHub 账号或仓库。每项都先说明作用，得到同意后再做。需要用户自己输入的命令，请他们在提示符里输入 `! <命令>` 来运行。

1. **安装 Claude GitHub App**：打开 https://github.com/apps/claude ，安装到这个仓库。
2. **放密钥**，二选一：
   - 有 Claude Pro/Max 订阅：用户运行 `! claude setup-token` 拿到令牌，再运行 `! gh secret set CLAUDE_CODE_OAUTH_TOKEN` 粘贴进去。
   - 用 API 计费：用户运行 `! gh secret set ANTHROPIC_API_KEY` 粘贴 API key。
3. **仓库选项**：`gh repo edit --enable-auto-merge --delete-branch-on-merge`。打开自动合并后，检查全部通过时 GitHub 会自动合并 PR；合并后自动删除分支。
4. **issue 类型标签**：`gh label create type:feature --color 1d76db --force`、`gh label create type:bug --color d73a4a --force`、`gh label create type:chore --color c5def5 --force`。风险标签（`risk:*`、`human-reviewed`）由 `ai-review` 工作流第一次运行时自动创建。
5. **分支规则**：运行 `gh api repos/<owner>/<repo>/rulesets --method POST --input "<本技能目录>/github-settings/ruleset.json"`。规则保护默认分支和 main：所有改动走 PR，`ci`、`risk-gate`、`commit-lint` 通过、所有评论线程处理完才能合并。私有仓库在 GitHub 免费版上不能用分支规则，接口会报错：告诉用户可以改成公开仓库，或者升级 GitHub Pro；在那之前，这套流程只能靠自觉执行。

## 9. 试跑并汇报

建议用户用一个小改动试一遍：改一处文档，运行 `/open-pr`，然后在 PR 页面看 `ci`、`commits`、`ai-review`、`security-review` 是否都跑起来了。跑不跑由用户决定。

最后汇报：装了哪些文件、各填了什么、选了哪种分支策略、哪些 GitHub 设置已完成、哪些还要用户自己做，并告诉用户 README.md 里有完整说明。
