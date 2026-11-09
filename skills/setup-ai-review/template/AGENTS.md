# AGENTS.md

Entry point for AI coding assistants (Claude Code, Codex, Cursor, GitHub Copilot and others). Whatever the tool, read these before changing anything:

1. `CLAUDE.md`: components, self-check commands, code standards, how to write code, branch and commit rules. The file is called CLAUDE, but its content applies to every tool.
2. The standards in `.claude/rules/` for the directories you are about to change (the `paths` at the top of each file say which directories it covers), including the layering rules that must be followed.
3. `REVIEW.md`: PRs are reviewed against it.
4. `docs/README.md`: the index of requirements, architecture, design, decision records and roadmap. Behavior users can see follows the design in `docs/design/`.

Every change merges through a PR. Before merging it must pass CI (tests, lint, architecture checks, duplicate code detection, commit message checks) and review; medium and high risk changes also need a maintainer's confirmation.
