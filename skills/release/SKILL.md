---
name: release
description: Release a version. Computes the next semantic version from the Conventional Commits since the last release, updates every component's version and CHANGELOG.md, runs the tests the project reserves for before a release (every environment combination, real devices or systems, upgrade from the last release, non-functional comparison with it), follows the branching strategy in CLAUDE.md (Git Flow: develop → release/x.y.z → main → tag → merge back into develop; GitHub Flow: tag on main), creates the GitHub Release and follows the production deployment (reminding the user when manual approval is needed) and how to roll back. Also handles tagging and merging back after a Git Flow hotfix lands on main. Use when the user says "release", "cut a version", "ship a version" or "tag a release".
---

# Releasing a version

## Steps

### 0. Read the strategy and current state

- Read "Branches and commits" in CLAUDE.md to find out whether it is GitHub Flow or Git Flow, "Components" for the components and "Tests" for the kinds of tests the project uses. Where each component keeps its version is in the "Version number" section of its stack's `stack.md` in the scaffold standards library (`scaffold/stacks/` next to this skill).
- `git fetch origin --tags` and find the last version tag: `git describe --tags --abbrev=0 origin/main` (without tags, the previous version is 0.0.0, counted from the first commit).
- Check for hotfixes merged into main but not tagged yet; if there are any, follow "Finishing a hotfix" below.
- Read `.github/workflows/deploy.yml` (if any) and the deployment section of `docs/architecture/overview.md` to learn where a version tag deploys and whether manual approval is needed.

### 1. Compute the version

List the commits to release since the last tag (Git Flow: `<last tag>..origin/develop`; GitHub Flow: `<last tag>..origin/main`), grouped by type. By semantic versioning:

- Breaking changes (`!` after the type, or `BREAKING CHANGE:` in the body) → major + 1
- Any `feat` → minor + 1
- Only `fix`, `perf` and the like → patch + 1
- While the major version is 0, breaking changes only bump the minor version

Show the user the version and a summary of the changes, and confirm the version with AskUserQuestion (recommend the one you computed).

### 2. Prepare the release

1. Update `CHANGELOG.md` (create it if missing): add a section `## <version> (<date>)` at the top, grouping changes under "Features", "Fixes", "Performance" and "Breaking changes", each with its PR or issue number. Leave out docs, CI, refactoring and chore commits. Write it in the project's document language.
2. Update each component's version as its stack describes.
3. Run every self-check command.
4. Run the tests of the "Before release" column of the stage table in the scaffold skill's `shared/testing.md` for the kinds the project uses, with the commands in the Tests section of CLAUDE.md or the project's CI: the end-to-end tests in every environment combination and, where the project has them, on real devices or systems; the delivery tests on every platform, including the upgrade from the last release (`<last tag>`) with its data; the non-functional tests in full, compared with the last release. Report what was not run here (a platform this machine cannot run, a device nobody has at hand) and who runs it; "not run" is never reported as passed. A failure stops the release until the user decides.
5. When staging runs exactly this batch of changes, ask the user to confirm it on staging before continuing.

### 3a. Git Flow

1. Branch `release/<version>` from develop, commit the changes above as `chore(release): <version>`, push.
2. Create the PR: `gh pr create --base main --head release/<version> --title "chore(release): <version>"`, with this release's CHANGELOG and the rollback method (redeploy the previous version tag) in the body. Enable auto-merge with `gh pr merge --auto --merge`.
3. Tell the user: release PRs are always high risk and get no further AI review (their code was reviewed when it went into develop); ask them to add the `human-reviewed` label once they confirm the release.
4. After the merge, tag the merge commit on main and push the tag: `git fetch origin && git tag -a v<version> origin/main -m "v<version>" && git push origin v<version>`.
5. Merge back: `gh pr create --base develop --head main --title "chore(release): merge v<version> back"` with auto-merge. These PRs are low risk and merge automatically once checks pass.

### 3b. GitHub Flow

1. Branch `chore/release-<version>` from main, commit `chore(release): <version>`, merge with /open-pr.
2. After the merge, tag main and push the tag: `git fetch origin && git tag -a v<version> origin/main -m "v<version>" && git push origin v<version>`.

### 4. GitHub Release

`gh release create v<version> --title "v<version>" --notes-file <this release's CHANGELOG section>`.

### 5. Production deployment

- With a deployment workflow: it starts when the version tag is pushed. Find the run with `gh run list --workflow deploy.yml --limit 3`; when production needs manual approval, tell the user to approve it on the GitHub Actions page (Review deployments). Once deployed, check that the health endpoint or home page responds.
- With a platform's own Git integration: tell the user to confirm the deployment status on the platform.
- Without automatic deployment: tell the user which version to deploy by hand.
- When something goes wrong after deployment: roll back by redeploying the previous version tag (rerun that tag's deployment workflow, or switch back on the platform). Prefer switching off a feature flag when that solves it.

### Finishing a hotfix (Git Flow)

Urgent production problems are fixed with `/implement`: branch `hotfix/<version>` from main, merge the PR into main. After the merge, run /release:

1. The version is the last tag's patch + 1.
2. Commit the CHANGELOG and version changes on the hotfix branch; when it is already merged, add a PR from `hotfix/<version>-release` branched from main.
3. Tag main, create the GitHub Release and follow the production deployment (as in 3a step 4, step 4 and step 5).
4. Merge back into develop (as in 3a step 5). On conflicts, branch from develop locally, merge main, resolve the conflicts and open a PR back into develop.

### 6. Report

Say which version was released, what it contains, the tag and Release links, which before-release tests ran and which did not, the deployment status, and anything the user still needs to do (e.g. approve the production deployment).
