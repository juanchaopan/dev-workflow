---
description: Self-check, simplify and review locally, then open the PR — runs the self-check commands in CLAUDE.md, a simplification pass, local code-review and security-review and the commit message check, and once everything passes creates the PR from the template and enables auto-merge
---

Turn the current changes into a reviewable PR. Work in order, and show the real command output at every step instead of just saying "done".

1. **Branch**: read "Branches and commits" in CLAUDE.md to find this change's target branch (main for GitHub Flow; for Git Flow, develop for normal changes and main for hotfixes). When you are on the target branch or another protected branch, create a branch following the naming rules. When the working tree has changes unrelated to this task, ask me how to handle them first. Run `git fetch origin`, then `git config core.hooksPath`: when it does not print `.githooks`, tell me the local commit message hook is off and suggest I run `! git config core.hooksPath .githooks` once; carry on either way, since step 6 checks every message itself.
2. **Self-check**: for every component you changed, run the commands in "Self-check commands" in CLAUDE.md, then `npx jscpd .` at the repository root. Fix any failure and start over until everything passes. When a screen changed, compare screenshots with the design (the confirmed screenshots in `docs/design/screens/` or the design files).
3. **Simplify**: run `simplify` with the Skill tool to look for existing code to reuse, unnecessary abstraction, duplicated logic and anything that reads like patchwork (see "How to write code" in CLAUDE.md). If code changed, go back to step 2.
4. **Code review**: run `code-review` with the Skill tool on the current branch's changes against the target branch. Fix each finding or say why not. If code changed, go back to step 2.
5. **Security review**: run `security-review` with the Skill tool and handle each finding the same way.
6. **Tidy the commits**:
   - Check `git log origin/<target branch>..HEAD`. Each commit does one thing and nothing unrelated is mixed in; refactoring and feature changes are separate commits. Split uncommitted changes into logical commits.
   - Run `node .github/scripts/check-commit-message.mjs --range origin/<target branch>..HEAD`. It applies exactly the rules of CI's `commit-lint` (type, format, first line at most 100 characters, blank line before the body, no leftover fixup! commits), whether or not the local hook is on. Do not judge the messages by eye instead.
   - Reword every commit it reports before pushing: the last one with `git commit --amend -m "<message>"`; an earlier one with a rebase that stops there, `GIT_SEQUENCE_EDITOR="sed -i.bak -e 's/^pick <short hash>/edit <short hash>/'" git rebase -i origin/<target branch>`, then `git commit --amend -m "<message>"` and `git rebase --continue`. Run the check again until it passes.
   - History that is already on the remote is not rewritten: further changes are new commits, and the branch catches up with the target by merging. When a commit that is already pushed fails the check, stop and ask me whether to reword the branch and push it with `git push --force-with-lease`, or to move the work to a new branch and PR.
7. **Push and create the PR**: push the branch and run `gh pr create --base <target branch>`. Fill the body following `.github/pull_request_template.md`:
   - What and why: the intent in a sentence or two; `Closes #<number>` for the issue.
   - Testing: the commands actually run in step 2 and a summary of the results; for screen changes, the implemented screen next to the confirmed design screenshot, plus a before screenshot for changes to an existing screen.
   - Risk: low, medium or high against `.github/risk-rules.txt`, with the reason.
   - How to revert: how to undo it; for data or configuration changes, how to restore them.
   - Leave the checklist unticked; I tick it myself after checking.
8. **Enable auto-merge**: run `gh pr merge <number> --auto --merge` following the merge method in CLAUDE.md (use the matching flag for squash or rebase). GitHub merges once every check passes and every review thread is resolved.
9. **Report**: give the PR link and the risk tier. For medium or high risk, remind me to read the whole diff myself first and add the `human-reviewed` label once satisfied; it merges automatically after that.

Every later push to this branch (review fixes, merging the target branch in) runs the commit message check of step 6 first.

$ARGUMENTS
