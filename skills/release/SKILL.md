---
name: release
description: Releases a version, on any code platform. Computes the next semantic version from the PR titles merged since the last release, opens a release PR that changes only VERSION, CHANGELOG.md and the components' version fields, lets its CI run the before-release checks, merges it by the high-risk rule, which tags the version and creates the platform's release. Stops when there is nothing to release. Deploying is /deploy. Use for "/release", "/release 1.0.0", "release a version" or "cut a version".
argument-hint: "[version]"
---

# Release

Read `../issue/workflow.md` first. Every rule there applies here. The main agent does the release itself; there is no issue for it.

When `.docs/architecture.md` does not exist, the project is not set up yet: say so and stop.

## The version

- Collect the titles of the PRs merged into `main` since the last release tag.
- `feat` raises the minor version, `fix` the patch version. A breaking change (`!`) raises the major version from `1.0.0` on, and the minor version while the version is `0.x`. The highest raise wins.
- `1.0.0` is released only when the user asks for it: `/release 1.0.0`. A version the user names is used as given.
- Otherwise ask which version: the computed one (Recommended), or one the user names.
- When nothing since the last release raises the version, tell the user there is nothing to release, and stop. A version the user names still releases.

## The release PR

1. Ask who gives the human approval in this run (`workflow.md`, "Pull requests, risk and merging"). A release PR is always high risk.
2. Create the branch `release/<version>` from the latest `main`.
3. Change only:
   - `VERSION` to the new version;
   - `CHANGELOG.md`: a section for the version with its date, listing the `feat` and `fix` PR titles, and the breaking changes in a section of their own;
   - every component file's version field that follows `VERSION` (the scaffold skill, "Generate").
4. Commit as `chore(release): <version>` with no issue reference, and open the PR with the same title.
5. Its CI runs the checks the architecture placed before a release. When a check fails, the PR does not merge and nothing is released: close the PR, tell the user what failed, and have the fix go through /change as a `fix` issue; then run /release again.
6. Handle the AI review comments, get the human approval, and merge it with the one command that confirms every condition first, squashing.
7. CI tags the version and creates the platform's release.

Tell the user the next command: `/deploy production`.
