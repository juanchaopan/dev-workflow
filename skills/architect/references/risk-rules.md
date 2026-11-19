# Risk rules

Reference list for architect step 11. The project's risk rules file lists path patterns in two groups, and the CI job `risk` gives every PR a tier from the files it changes:

- any changed file matching a **high** pattern → high;
- every changed file matching a **low** pattern → low;
- anything else → medium;
- a release PR (`release/*` branch) → high, whatever it changes.

Medium and high PRs need a person's approval before they merge (`../../issue/workflow.md`). The rules are read from the target branch, so a PR that changes the rules file does not change its own tier.

The patterns below are the usual starting point. Go through them with the user: keep what fits the project, translate the names to the project's own directories and files, and add the project's own sensitive areas.

## Pattern syntax

One pattern per line, relative to the repository root. `**` matches any number of directories (`**/auth/**` matches an `auth` directory anywhere); `*` matches any characters within one directory level (`.docs/*.md`).

## High risk

**The workflow and the checks themselves.** Relaxing a check, changing a baseline or changing CI always needs a person.

```text
<CI configuration directory>/**      e.g. .github/**, .gitlab-ci.yml, azure-pipelines.yml, bitbucket-pipelines.yml, .gitea/**, .forgejo/**
<git hooks directory>/**             e.g. .githooks/**, .husky/**, lefthook.yml
.claude/**
AGENTS.md
CLAUDE.md
REVIEW.md
<risk rules file>
<task runner file>                   e.g. Taskfile.yml, justfile, Makefile
<configuration of every static check tool>   e.g. eslint.config.*, ruff.toml, checkstyle.xml, .editorconfig
<architecture rule files and their baselines>
```

**Screenshot baselines.** A changed look needs a person comparing the old and new screenshots.

```text
<baseline screenshot directories>    e.g. **/*-snapshots/**, **/__screenshots__/**
```

**Business-sensitive code.**

```text
**/auth/**
**/billing/**
**/payment/**
**/payments/**
<migration scripts>                  e.g. **/migrations/**, **/*.sql
**/.env*
<infrastructure as code>             e.g. infra/**, **/*.tf
**/Dockerfile
<deployment configuration>
```

## Low risk

Text only.

```text
.docs/**
**/*.md
**/*.txt
LICENSE
```

High wins over low: `AGENTS.md` and `REVIEW.md` are Markdown, yet high.
