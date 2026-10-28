---
name: implement
description: 开发一个 GitHub issue，从开分支一直做到合并：读 issue 和相关的需求、架构、规范，按 CLAUDE.md 的分支策略建分支，小步实现，每步带测试、通过自检后单独提交，再用 /open-pr 开 PR；然后处理 AI 代码审查和安全审查的每条意见，直到检查全部通过、自动合并。中、高风险的 PR 会提醒用户亲自确认。用法：/implement <issue 号>，或 /implement next 自动挑下一个可以做的 issue。
---

# 开发一个 issue

## 步骤

### 0. 选 issue

- `/implement <编号>`：`gh issue view <编号> --comments`。
- `/implement next`：列出当前最早的未完成里程碑里还开着的 issue（`gh issue list --milestone "<里程碑>" --state open --json number,title,body,labels`），选依赖都已关闭、编号最小的一个，告诉用户选了哪个。没有里程碑时，按 issue 编号从小到大选。

### 1. 读上下文

读 CLAUDE.md、issue 关联的 REQ（`docs/product/requirements.md`）、`docs/architecture/overview.md` 里相关的部分、相关的 ADR，以及要改的代码。`.claude/rules/` 里的规范会在改到对应文件时自动加载。

### 2. 检查是否可以开工

- 验收标准不清楚、互相矛盾，或者和文档对不上时，停下来用 AskUserQuestion 问用户。问题涉及需求或架构本身时，建议用户先运行 /change。
- 依赖的 issue 还没完成时，告诉用户。

### 3. 小计划

列出要做的步骤：每一步改哪些文件、加哪些测试。大小为 S 的直接开始；大小为 M，或者你估计会改 500 行以上的，先把计划给用户看，确认后再做。估计会超过 M 时，建议用户把 issue 拆开。

### 4. 建分支

读 CLAUDE.md「分支与提交」：

- 确定基础分支：GitHub Flow 是 main；Git Flow 下 feature 和 fix 是 develop，hotfix 是 main。
- `git fetch origin`，切到基础分支，`git pull --ff-only`。
- 按命名规则建分支，例如 `feature/12-email-login`、`fix/31-empty-list`。

### 5. 小步实现

每一步：

1. 先写或更新测试，描述这一步要实现的行为（能先写测试的就先写）。
2. 写实现。
3. 对改到的组件运行 CLAUDE.md 的自检命令，全部通过。
4. 提交。一个提交只做一件事，提交信息用 Conventional Commits 并带上 issue 号，例如 `feat(auth): 支持邮箱登录 (#12)`、`test(auth): 补充密码错误的测试 (#12)`。

规则：

- 每个提交都要能单独通过自检，不提交跑不通的中间状态。
- 不把和 issue 无关的改动（顺手的重构、格式调整）混进来；确实需要的，单独提交并在 PR 里说明。
- 实现时发现文档没写到的情况，小的细节按最合理的方式处理并在 PR 里说明；涉及业务规则或架构的，停下来问用户。
- 不提交密钥、令牌、个人数据和生成的构建产物。

### 6. 开 PR

用 Skill 工具运行 `open-pr`（项目里的 `/open-pr` 命令）。它会再跑一遍自检和本地审查，按模板写 PR，正文写 `Closes #<编号>`，并开启自动合并。

### 7. 处理审查意见

1. 等检查跑完：`gh pr checks <PR 号> --watch --interval 30`（AI 审查要几分钟，这条命令放在后台运行）。
2. 读还没解决的评论线程：

   ```
   gh api graphql -F owner=<owner> -F repo=<repo> -F number=<PR 号> -f query='
     query($owner: String!, $repo: String!, $number: Int!) {
       repository(owner: $owner, name: $repo) {
         pullRequest(number: $number) {
           reviewThreads(first: 100) {
             nodes { id isResolved path line comments(first: 20) { nodes { databaseId author { login } body } } }
           }
         }
       }
     }'
   ```

3. 逐条处理：
   - **[Important]、[Security]**：修掉。认为不该修时，在线程里回复理由，但**不要自己关闭线程**，告诉用户由他决定。
   - **[Nit]、[Pre-existing]**：值得修就修；不修就回复理由并关闭线程。
   - 修好的问题：回复"已在 <提交号> 修复"，再关闭线程。
   - 回复：`gh api repos/<owner>/<repo>/pulls/<PR 号>/comments/<comment databaseId>/replies -f body="<内容>"`
   - 关闭线程：`gh api graphql -F id=<thread id> -f query='mutation($id: ID!) { resolveReviewThread(input: {threadId: $id}) { thread { isResolved } } }'`
4. 修复按第 5 步的规则提交（例如 `fix(auth): 处理审查意见：校验邮箱格式 (#12)`）并推送。推送会触发新一轮审查，回到 1。
5. CI 失败时读日志（`gh run view <run id> --log-failed`），修好再推送。
6. AI 审查到达轮数上限时停下来，把情况告诉用户，建议拆小 PR 或换做法。

### 8. 合并

- 低风险：检查全部通过、线程都处理完后会自动合并。
- 中、高风险：告诉用户 PR 链接和风险等级，请他亲自读完 diff，确认后加 `human-reviewed` 标签，加上后会自动合并。用户要求的修改按第 7 步处理（新提交会撤掉标签，需要用户重新确认）。

合并后：切回基础分支，`git pull --ff-only`，删除本地分支。

### 9. 汇报

说明完成了哪个 issue、PR 链接、改了什么、处理了哪些审查意见、有没有需要用户注意的事。问用户是否继续 `/implement next`。
