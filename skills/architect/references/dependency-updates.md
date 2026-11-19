# Dependency updates: Dependabot vs Renovate (as of 2026-11-17)

Scope: keep every version in a project pinned and get a pull request when a library, runtime, Docker image, CI action or build tool wrapper has a new version, on GitHub, Azure DevOps, GitLab and other platforms.

Legend: **Y** supported, **N** not supported, **P** partial, **(unverified)** not confirmed from an official source, **(inferred)** concluded from source code or examples rather than stated in docs.

Short source keys used in the tables:

| Key | URL |
|---|---|
| DB-eco | https://docs.github.com/en/code-security/reference/supply-chain-security/supported-ecosystems-and-repositories (source: https://github.com/github/docs/blob/main/data/reusables/dependabot/supported-package-managers.md) |
| DB-opt | https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference |
| DB-gha | https://github.com/github/docs/blob/main/data/reusables/actions/dependabot-version-updates-actions-caveats.md |
| DB-docker | https://github.com/dependabot/dependabot-core/blob/main/docker/README.md |
| DB-sec | https://docs.github.com/en/code-security/dependabot/dependabot-security-updates/about-dependabot-security-updates |
| RN-mgr | https://docs.renovatebot.com/modules/manager/ |
| RN-node | https://docs.renovatebot.com/node/ |
| RN-gha | https://docs.renovatebot.com/modules/manager/github-actions/ |
| RN-docker | https://docs.renovatebot.com/docker/ |
| RN-java | https://docs.renovatebot.com/java/ |
| RN-opt | https://docs.renovatebot.com/configuration-options/ |
| RN-cfg | https://docs.renovatebot.com/presets-config/ |
| RN-wa | https://docs.renovatebot.com/presets-workarounds/ |
| RN-plat | https://docs.renovatebot.com/modules/platform/ |
| RN-run | https://docs.renovatebot.com/getting-started/running/ |
| RN-mend | https://docs.renovatebot.com/mend-hosted/overview/ |
| SN | https://github.com/actions/setup-node/blob/main/README.md and https://github.com/actions/setup-node/blob/main/docs/advanced-usage.md |
| EOL | https://endoflife.date/docs/api/v1/ (live data: https://endoflife.date/api/v1/products/nodejs/) |

---

## 1. Dependabot

### 1.1 All `package-ecosystem` values (DB-eco, DB-opt)

| YAML value | Package manager(s) | Files updated | Version upd. | Security upd. |
|---|---|---|---|---|
| `apm` | Agent Package Manager | `apm.yml`, `apm.lock.yaml` | Y | N |
| `bazel` | Bazel v7–v9 | Bazel module files (unverified which) | Y | N |
| `bun` | Bun >=1.1.39 | `package.json`, `bun.lock` (not `bun.lockb`) | Y | N |
| `bundler` | Bundler v2 | `Gemfile`, `Gemfile.lock` | Y | Y |
| `cargo` | Cargo v1 | `Cargo.toml`, `Cargo.lock` | Y | Y |
| `composer` | Composer v2 | `composer.json`, `composer.lock` | Y | Y |
| `conda` | Conda | `environment.yml` (no lock files) | Y | Y |
| `deno` | Deno >=2 | `deno.json`, `deno.jsonc` | Y | Y |
| `devcontainers` | Dev containers | Features in `devcontainer.json` + its lockfile | Y | N |
| `docker` | Docker | `Dockerfile` `FROM`, Kubernetes manifests, Helm charts | Y | N |
| `docker-compose` | Compose v2/v3 | `docker-compose.yml`/`compose.yml` images | Y | N |
| `dotnet-sdk` | .NET SDK >=3.1 | `global.json` ([file_fetcher.rb](https://github.com/dependabot/dependabot-core/blob/main/dotnet_sdk/lib/dependabot/dotnet_sdk/file_fetcher.rb)) | Y | N |
| `elm` | elm-package 0.19 | `elm.json` | Y | N |
| `gitsubmodule` | git submodules | `.gitmodules` / submodule SHAs | Y | N |
| `github-actions` | GitHub Actions | `uses: owner/repo@ref` in workflows and actions | Y | Y |
| `gomod` | Go modules | `go.mod`, `go.sum` | Y | Y |
| `gradle` | Gradle | `build.gradle(.kts)`, `libs.versions.toml`, `gradle.lockfile`, applied `*dependencies*` files, Gradle Wrapper (`gradle-wrapper.properties`, `gradlew`, `gradlew.bat`, jar) | Y | Y (only via Dependency Submission API) |
| `helm` | Helm v3 | `Chart.yaml` deps and images in charts | Y | N |
| `julia` | Julia >=1.10 (community) | `Project.toml`, `Manifest.toml` | Y | N |
| `maven` | Maven | `pom.xml` (Maven not run) | Y | Y |
| `mix` | Hex | `mix.exs`, `mix.lock` | Y | N |
| `nix` | Nix flakes | `flake.lock` only (not refs in `flake.nix`) | Y | N |
| `npm` | npm 7–12, pnpm 7–12, yarn 1–4 | `package.json` + lock file | Y | Y |
| `nuget` | NuGet <=6.12 | project files, `packages.config` etc. | Y | Y |
| `opentofu` | OpenTofu (community) | `.tf`, `.tofu`, `terragrunt.hcl`, `.terraform.lock.hcl` | Y | N |
| `pip` | pip, pip-compile, pipenv, poetry | `*.txt`, PEP 621 `pyproject.toml`, `Pipfile(.lock)`, `poetry.lock` | Y | Y |
| `pre-commit` | pre-commit | `rev:` in `.pre-commit-config.yaml`, `additional_dependencies` | Y | N |
| `pub` | Dart pub v2 (community) | `pubspec.yaml`, `pubspec.lock` | Y | Y |
| `rust-toolchain` | Rust toolchain | `rust-toolchain.toml`, `rust-toolchain` (`1.xx(.yy)`, dated channels) | Y | N |
| `sbt` | sbt | `build.sbt`, `project/plugins.sbt`, `project/build.properties`, `project/*.scala` | Y | N |
| `swift` | SwiftPM v5/v6 | `Package.swift`, `Package.resolved` | Y | Y |
| `terraform` | Terraform 0.13–1.15 | modules, providers, `.terraform.lock.hcl` | Y | N |
| `uv` | uv 0.11 | `pyproject.toml`, `uv.lock` | Y | Y |
| `vcpkg` | vcpkg | `builtin-baseline` in `vcpkg.json` | Y | N |

2026 additions per the GitHub changelog: Nix ([2026-04-07](https://github.blog/changelog/2026-04-07-dependabot-version-updates-now-support-the-nix-ecosystem/)), sbt ([2026-05-26](https://github.blog/changelog/2026-05-26-dependabot-version-updates-now-support-the-sbt-ecosystem/)), Deno ([2026-06-09](https://github.blog/changelog/2026-06-09-dependabot-version-updates-now-support-the-deno-ecosystem/)). Rust toolchain arrived on [2025-08-19](https://github.blog/changelog/2025-08-19-dependabot-now-supports-rust-toolchain-updates/). The dependabot-core repository has updater folders for exactly these ecosystems and nothing for asdf, mise, nvm, pyenv or similar ([repo root](https://github.com/dependabot/dependabot-core)).

### 1.2 Runtime and tool versions in Dependabot

| Item | Dependabot | Evidence |
|---|---|---|
| `.nvmrc` | N | open issues [#4808](https://github.com/dependabot/dependabot-core/issues/4808), [#14752](https://github.com/dependabot/dependabot-core/issues/14752) |
| `.node-version` | N | no ecosystem reads it (DB-eco) |
| `package.json` `engines.node` | N | open issue [#11243](https://github.com/dependabot/dependabot-core/issues/11243) |
| `actions/setup-node` `node-version:` (any `with:` input) | N | only `uses:` refs are updated (DB-gha) |
| `FROM node:24` in Dockerfile | Y, including majors, not LTS-aware (inferred) | SemVer tag parsing, same prefix/suffix kept (DB-docker); example major PR node 16→18 labelled `semver-major` ([PR](https://github.com/HTC37/docs/pull/14)); a non-LTS `node:25` PR stream ([example](https://dependabot.ecosyste.ms/hosts/GitHub/repositories/devsecopsmaturitymodel%2FDevSecOps-MaturityModel/issues/512)) |
| Java: Gradle toolchain `JavaLanguageVersion.of(n)` | N | not in Gradle file list (DB-eco) |
| Java: `maven.compiler.release` | N | not documented (DB-eco) |
| Java Docker images (`eclipse-temurin:21`) | Y, all majors incl. non-LTS (inferred) | Docker SemVer handling (DB-docker) |
| `.python-version` | N | read by uv only to choose an interpreter; issues [#13858](https://github.com/dependabot/dependabot-core/issues/13858), [#16820](https://github.com/dependabot/dependabot-core/issues/16820) |
| `requires-python` | N (unverified) | not documented |
| .NET `global.json` | Y (`dotnet-sdk`) | DB-eco |
| Go `go` directive | N (may be raised as a side effect of a dependency update) | [#15714](https://github.com/dependabot/dependabot-core/issues/15714) |
| Go `toolchain` directive | N | open issue [#13520](https://github.com/dependabot/dependabot-core/issues/13520) |
| `rust-toolchain(.toml)` | Y | DB-eco |
| Gradle wrapper | Y (in `gradle` ecosystem) | DB-eco |
| Maven wrapper | Y, but not documented (unverified) | PRs bump `org.apache.maven:apache-maven` in the wrapper ([#15933](https://github.com/dependabot/dependabot-core/issues/15933)); feature request closed 2026-11-05 ([#13183](https://github.com/dependabot/dependabot-core/issues/13183)) |
| `.tool-versions` (asdf) | N | open since 2019 ([#1033](https://github.com/dependabot/dependabot-core/issues/1033)) |
| `mise.toml` | N | request [#12320](https://github.com/dependabot/dependabot-core/issues/12320), PR [#14500](https://github.com/dependabot/dependabot-core/pull/14500) open |
| Dev containers | P: Features only, pinned to latest major | DB-eco |
| Helm | Y: chart versions + images in charts | DB-eco |
| Terraform / OpenTofu | Y: modules, providers | DB-eco |
| docker-compose | Y | DB-eco |
| GitHub runner labels (`ubuntu-latest`) | N | DB-gha |

### 1.3 Docker tag handling (DB-docker, DB-eco)
- Tags are parsed as SemVer, dates (`yyyy-mm(-dd)`) or build numbers. An update must keep the same prefix and suffix (`24-alpine` stays `*-alpine`). A pre-release tag only moves to a matching pre-release.
- Major bumps are offered by default; nothing restricts them to LTS releases. To limit majors use `ignore` with `update-types: ["version-update:semver-major"]` or version ranges (DB-opt).
- Cooldown on Docker only works with Docker Hub publication dates. Other registries get the update with a `cooldown_date_unavailable` warning.

### 1.4 Security updates vs version updates (DB-sec, DB-opt)

| Aspect | Version updates | Security updates |
|---|---|---|
| Trigger | `schedule.interval` in `dependabot.yml` (required) | a Dependabot alert; no `dependabot.yml` needed |
| Branch | `target-branch` allowed | always the default branch |
| Open-PR limit | `open-pull-requests-limit`, default 5 | fixed at 10, not configurable |
| Cooldown | default 3 days, configurable | none |
| Transitive deps | direct only (Gradle: direct only) | npm: updates/removes the parent; NuGet: may add a direct pin; others: not when the parent must change |
| Ecosystems | all in 1.1 | only those marked Y in the "Security upd." column |

### 1.5 Grouping, schedules, limits (DB-opt)
- `groups`: `patterns`, `exclude-patterns`, `dependency-type` (development/production), `update-types` (major/minor/patch), `applies-to` (version-updates or security-updates), `group-by: dependency-name` (across directories). Groups never cross ecosystems, except with `multi-ecosystem-groups` (version updates only).
- `schedule.interval`: `daily`, `weekly`, `monthly`, `quarterly`, `semiannually`, `yearly`, `cron` (+ `cronjob`), with `day`, `time`, `timezone` (default UTC).
- `cooldown`: `default-days` (3 when unset), `semver-major-days`, `semver-minor-days`, `semver-patch-days`, `include`/`exclude`.
- `versioning-strategy`: `auto`, `increase`, `increase-if-necessary`, `lockfile-only`, `widen` (only bundler, cargo, composer, helm, mix, npm, pip, pub, uv).
- No automerge setting, no dashboard, no custom/regex managers, no shared presets. Automerge requires a separate workflow.

---

## 2. Scenario: `actions/setup-node` with `node-version: lts/*`

Facts:
- Node 26 became LTS on **2026-10-28**. Node 24 left active support on 2026-10-20 (EOL 2028-04-30). Node 25 has been EOL since 2026-06-01 ([EOL](https://endoflife.date/api/v1/products/nodejs/)). The latest setup-node release is v7.1.0 (2026-10-08) ([releases](https://github.com/actions/setup-node/releases)).
- setup-node resolves `lts/*` at each run from the actions/node-versions manifest ("LTS aliases require a manifest to resolve the requested version"). With the default `check-latest: false` it uses a cached match when the runner has one, otherwise it downloads (SN).

| Question | Answer |
|---|---|
| Does anything open a PR when Node 26 becomes LTS while CI uses `lts/*`? | **No.** Dependabot ignores `with:` inputs (DB-gha). Renovate's node versioning only accepts versions, ranges or bare LTS codenames such as `jod`. `lts/*` is not valid, so the dependency is skipped (inferred from [versioning/node/index.ts](https://github.com/renovatebot/renovate/blob/main/lib/modules/versioning/node/index.ts) and [schedule.ts](https://github.com/renovatebot/renovate/blob/main/lib/modules/versioning/node/schedule.ts)). |
| What happens in CI? | CI **silently switched to Node 26** once the manifest listed 26 as LTS, around 2026-10-28. The exact day depends on when actions/node-versions published it (unverified). Local dev (`.nvmrc`), Docker images and `engines` stay on 24, so the environments drift apart. |
| Which tool opens a PR for pinned `node-version: 24`? | **Renovate only.** The github-actions manager extracts `node-version` of `actions/setup-node` as a `uses-with` dependency with `node` versioning (RN-gha). A new major counts as stable only once it reaches LTS ([node versioning](https://docs.renovatebot.com/modules/versioning/node/)), so the PR `24 → 26` comes after 2026-10-28, and Node 25 was never offered. Dependabot: no. |
| Recommended setup | One source of truth: pin an exact version in `.nvmrc` (or `devEngines.runtime`) and use `node-version-file: .nvmrc` (SN). Renovate updates `.nvmrc`, `.node-version`, `engines`, `devEngines.runtime`, `volta`, `.tool-versions` and mise files (RN-node). Pin Docker `FROM node:26.x.y-<variant>@sha256:…`. |

From Node 27 on, every major becomes LTS ([node versioning](https://docs.renovatebot.com/modules/versioning/node/)). Renovate then offers each major once it reaches LTS.

---

## 3. Dependabot outside GitHub

| Platform | Native Dependabot | Maintained alternative | Status 2026-11 |
|---|---|---|---|
| Azure DevOps | **No.** GitHub Advanced Security for Azure DevOps gives dependency-scanning **alerts**, plus a paid Copilot Autofix "Generate fix" PR per alert; no version updates ([MS Learn](https://learn.microsoft.com/en-us/azure/devops/repos/security/github-advanced-security-dependency-scanning)) | tinglesoftware extension, renamed Paklo (`mburumaxwell/paklo`) | **Archived 2026-09-01**, "no longer maintained", final release `extension-azure-devops@2.68.7` ([repo](https://github.com/mburumaxwell/paklo)) |
| GitLab | **No** Dependabot. GitLab Ultimate offers "Resolve with scanner suggestion" MRs for dependency findings, only for Node.js/yarn ([GitLab docs](https://docs.gitlab.com/user/application_security/vulnerabilities/)) | dependabot-gitlab | Active (last release v7.12.0-alpha.1, 2026-10-23). Still labelled alpha / "Work in Progress", not affiliated with GitHub ([project](https://gitlab.com/dependabot-gitlab/dependabot)) |
| Bitbucket | No (unverified: no native version-update bot found) | none found (unverified) | — |
| Any CI | — | `dependabot` CLI runs single update jobs in Docker (v1.97.0, 2026-10-27). It does not open PRs on other platforms by itself ([repo](https://github.com/dependabot/cli)) | active, low-level |

---

## 4. Renovate

### 4.1 Managers for the runtime cases (RN-mgr: 122 managers + `regex`, `jsonata` custom managers)

| Item | Renovate | Manager / note |
|---|---|---|
| `.nvmrc` | Y | `nvm` (node versioning) |
| `.node-version` | Y | `nodenv` |
| `engines`, `devEngines.runtime`, `volta`, `packageManager` | Y | `npm` (RN-node). With `rangeStrategy: auto`, an open range such as `>=20` is never out of range, so pin an exact version or use `bump` |
| `actions/setup-node` `node-version` (and setup-python/go/java/dotnet, setup-uv, setup-bun, ~90 actions) | Y | `github-actions` `uses-with` depType (RN-gha) |
| `runs-on` runner labels, `container:`, `services:` | Y | `github-actions` (`github-runner`, `container`, `service` depTypes) |
| `FROM node:24` | Y. Majors offered, **LTS only for `node` images** in `config:recommended` | `dockerfile` + `workarounds:nodeDockerVersioning` (RN-wa, RN-cfg) |
| Java Docker images / JDK | Y, **LTS only** in `config:recommended` | `workarounds:javaLTSVersions` (RN-java) |
| Gradle toolchain `JavaLanguageVersion.of(n)` | N built-in (not in docs) | `regex` custom manager + `java-version` datasource |
| `maven.compiler.release` | N built-in (unverified) | `regex` custom manager |
| `.python-version` | Y | `pyenv` (docker `python` tags) ([doc](https://docs.renovatebot.com/modules/manager/pyenv/)) |
| `requires-python` | Extracted; whether it is bumped is unverified | `pep621` ([doc](https://docs.renovatebot.com/modules/manager/pep621/)) |
| .NET `global.json` SDK + `msbuild-sdks`, `dotnet-tools.json` | Y | `nuget` ([doc](https://docs.renovatebot.com/modules/manager/nuget/)) |
| Go `go` directive | Extracted, **not bumped by default** (needs `rangeStrategy: bump`) | `gomod` ([doc](https://docs.renovatebot.com/modules/manager/gomod/)) |
| Go `toolchain` directive | Y by default | `gomod` |
| `rust-toolchain(.toml)` | Y | `rust-toolchain` manager |
| Gradle wrapper | Y (`gradle-wrapper.properties`, `gradlew`, `gradlew.bat`, jar) | `gradle-wrapper` (RN-java) |
| Maven wrapper | Y (`.mvn/wrapper/maven-wrapper.properties`, `mvnw`) | `maven-wrapper` ([source](https://github.com/renovatebot/renovate/tree/main/lib/modules/manager/maven-wrapper)) |
| `.tool-versions` | Y (tool by tool; first version per tool) | `asdf` |
| `mise.toml` | Y (1,053 of 1,103 registry tools) | `mise` ([doc](https://docs.renovatebot.com/modules/manager/mise/)) |
| Dev containers | Y: `image` and `features` | `devcontainer` |
| Helm | Y | `helmv3`, `helm-values`, `helmfile`, `helmsman` |
| Terraform | Y (+ `.terraform-version`, Terragrunt, TFLint) | `terraform`, `terraform-version`, `terragrunt` |
| docker-compose | Y | `docker-compose` |
| Kubernetes manifests | Y (manager must be pointed at files; default patterns unverified) | `kubernetes`, `kustomize`, `argocd`, `flux` |
| Other CI | Y | `azure-pipelines`, `gitlabci`, `bitbucket-pipelines`, `circleci`, `woodpecker`, … |

### 4.2 Platforms (RN-plat)
Supported: `github`, `gitlab`, `azure`, `bitbucket` (Cloud), `bitbucket-server` (Data Center), `gitea`, `forgejo`. Experimental: `codecommit`, `gerrit`, `scm-manager`, `local`. On Azure DevOps the Dependency Dashboard is a work item of type Issue, and the PAT needs Code R/W and Work Items R/W ([azure](https://docs.renovatebot.com/modules/platform/azure/)).

### 4.3 Hosting options and cost

| Option | Platforms | Cost | Source |
|---|---|---|---|
| Mend Renovate Community Cloud | GitHub, GitLab, Bitbucket Cloud, Azure DevOps | Free, unlimited public+private repos; 1 concurrent job per org, runs every 4 h, 30 min timeout | RN-mend |
| Mend Renovate Community (OSS) Cloud | same | Free for accepted OSI projects; 2 jobs, Merge Confidence included | RN-mend |
| Mend Renovate Enterprise Cloud | same | Paid (sales); 16 jobs, hourly | RN-mend |
| Self-hosted CLI (npm / Docker image) in any pipeline | all platforms | Free OSS (AGPL-3.0); you pay CI minutes | RN-run |
| `renovatebot/github-action` | GitHub | Free; Actions minutes | [repo](https://github.com/renovatebot/github-action) |
| GitLab `renovate-runner` | gitlab.com, self-managed | Free; CI minutes | [project](https://gitlab.com/renovate-bot/renovate-runner) |
| Azure Pipelines scheduled pipeline | Azure DevOps (cloud + Server) | Free; pipeline minutes (Microsoft's free tier unverified) | [azure](https://docs.renovatebot.com/modules/platform/azure/) |
| Mend Renovate Self-Hosted CE / EE | GitHub(.com/ES), GitLab, Bitbucket DC | CE free under EULA, EE paid | RN-run, [mend/renovate-ce-ee](https://github.com/mend/renovate-ce-ee) |

Current CLI release: 44.251.0 (2026-11-17) ([repo](https://github.com/renovatebot/renovate)).

### 4.4 Key features (RN-opt unless noted)

| Feature | Behavior |
|---|---|
| Grouping | `packageRules` with `groupName`, matching on any field (manager, datasource, name, update type). Groups can span ecosystems. `group:monorepos`, `group:recommended` in `config:recommended` |
| Automerge | `automerge`, `automergeType` (`pr`, `branch`, `pr-comment`, `label`), `platformAutomerge` (default true), `automergeSchedule` ([automerge](https://docs.renovatebot.com/key-concepts/automerge/)) |
| Schedules | `schedule` in cron syntax (Later syntax deprecated), per rule; `timezone` ([scheduling](https://docs.renovatebot.com/key-concepts/scheduling/)) |
| Limits | `prConcurrentLimit` default 10, `prHourlyLimit` default 2, `branchConcurrentLimit` ([options/index.ts](https://github.com/renovatebot/renovate/blob/main/lib/config/options/index.ts)). Security PRs bypass the limits |
| Dependency Dashboard | issue listing pending/open/closed/errored updates; on by default via `config:recommended`. `dependencyDashboardApproval` holds chosen updates (e.g. majors) until a box is ticked |
| Lock file maintenance | `lockFileMaintenance.enabled` (off by default; `:maintainLockFilesWeekly` in `config:best-practices`), runs "before 4am on monday" |
| `minimumReleaseAge` | per-version wait with a `renovate/stability-days` status check; needs datasource release timestamps; `security:minimumReleaseAgeNpm` in `config:best-practices` |
| Custom managers | `customManagers` of `customType: regex` or `jsonata`, typically with `# renovate: datasource=… depName=…` comments ([regex](https://docs.renovatebot.com/modules/manager/regex/)) |
| Presets | shareable config from a repo on any platform (`github>`, `gitlab>`, `local>` …) ([presets](https://docs.renovatebot.com/key-concepts/presets/)). `config:best-practices` adds digest pinning for Docker and Actions, `:pinDevDependencies`, `abandonments:recommended` (RN-cfg) |
| Range strategy | `auto`, `pin`, `bump`, `replace`, `widen`, `update-lockfile`, `in-range-only` |
| Abandoned packages | `abandonmentThreshold` flags packages without releases for a set period |

### 4.5 Vulnerability alerts vs Dependabot security updates

| | Dependabot security updates | Renovate |
|---|---|---|
| Data | GitHub Advisory DB via the dependency graph | `vulnerabilityAlerts`: reads **GitHub's** Dependabot alerts (GitHub only; needs the dependency graph and alerts enabled and app permission). `osvVulnerabilityAlerts`: OSV database downloaded offline, any platform |
| Coverage | ecosystems marked Y in 1.1; transitive for npm/NuGet | OSV: **direct deps only** (except uv via pep621), datasources crate, go, hackage, hex, maven, npm, nuget, packagist, pypi, rubygems |
| Behavior | separate PRs, fixed limit 10, default branch | PRs titled `[SECURITY]`, ignore schedule and limits ("skip the line") |
| Malware | Dependabot malware alerts (npm since [2026-03-17](https://github.blog/changelog/2026-03-17-dependabot-now-detects-malware-in-npm-dependencies/), more ecosystems [2026-07-28](https://github.blog/changelog/2026-07-28-dependabot-alerts-on-malicious-packages-across-more-ecosystems/)) | experimental OSV malicious-package detection blocks PRs |

---

## 5. End-of-life detection

| Way | What it gives | Source |
|---|---|---|
| endoflife.date API v1 | per release: `isLts`, `ltsFrom`, `eoasFrom`, `eolFrom`, `isMaintained`, latest patch, purl identifiers (e.g. `pkg:docker/library/node`) | EOL |
| Renovate `endoflife-date` datasource | turns EOL cycles into releases with `isDeprecated`; combined with `ignoreDeprecated` (default) Renovate never upgrades **to** an EOL cycle. Used with a regex manager for values like `kubernetes_version = "1.26"` | [datasource](https://docs.renovatebot.com/modules/datasource/endoflife-date/), [schema.ts](https://github.com/renovatebot/renovate/blob/main/lib/modules/datasource/endoflife-date/schema.ts) |
| Renovate LTS-aware versioning | `node` versioning and `workarounds:javaLTSVersions` steer upgrades to LTS lines, so a PR appears when the next LTS exists | RN-wa |
| xeol | scanner for EOL software in images, filesystems and SBOMs (active, last push 2026-10-06) | [repo](https://github.com/xeol-io/xeol) |
| Custom CI check | scheduled job that reads the pinned versions and fails or opens an issue when `eolFrom` is within N months (no ready-made official action verified) | EOL (unverified tooling) |
| Dependabot | no EOL feature found (unverified) | — |

Neither tool opens a PR that says "your current version reaches EOL on X" (unverified). The signal is the major-upgrade PR itself, or a CI check built on the endoflife.date API.

---

## 6. Silent version drift and how to pin

| Ecosystem | Floats silently when | Pin with | Lock file |
|---|---|---|---|
| npm/pnpm/yarn/bun | `^`/`~` ranges and no committed lock file, or `npm install` in CI | commit the lock file, use `npm ci` / `--frozen-lockfile`; exact versions via `save-exact` or Renovate `rangeStrategy: pin` | `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `bun.lock` ([npm](https://docs.npmjs.com/cli/v11/configuring-npm/package-lock-json), [npm ci](https://docs.npmjs.com/cli/v11/commands/npm-ci)) |
| Gradle | `1.+`, `latest.release`, `[1.0,2.0)` ([dynamic versions](https://docs.gradle.org/current/userguide/dynamic_versions.html)) | exact versions in `libs.versions.toml`; or `dependencyLocking { lockAllConfigurations() }` + `LockMode.STRICT`, `--write-locks` ([locking](https://docs.gradle.org/current/userguide/dependency_locking.html)); wrapper `distributionSha256Sum` | `gradle.lockfile`, `buildscript-gradle.lockfile` |
| Maven | version ranges `[1.0,2.0)`, plugins without versions ([POM](https://maven.apache.org/pom.html#Dependency_Version_Requirement_Specification)) | exact versions, `requirePluginVersions` enforcer rule ([enforcer](https://maven.apache.org/enforcer/enforcer-rules/requirePluginVersions.html)), Maven wrapper | none native (unverified) |
| pip | unpinned `requirements.txt` lines, `>=` | fully pinned and hashed requirements (`--require-hashes`, [pip](https://pip.pypa.io/en/stable/topics/secure-installs/)), or a project lock | `uv.lock`, `poetry.lock`, `pdm.lock`, `Pipfile.lock`, `pylock.toml` ([PEP 751](https://peps.python.org/pep-0751/)) |
| NuGet | `Version="1.2.3"` means `>= 1.2.3`; floating `1.*` ([MS Learn](https://learn.microsoft.com/en-us/azure/devops/repos/security/github-advanced-security-dependency-scanning)) | `RestorePackagesWithLockFile`, locked restore in CI ([NuGet](https://learn.microsoft.com/en-us/nuget/consume-packages/package-references-in-project-files#locking-dependencies)); `global.json` with `rollForward` set deliberately ([global.json](https://learn.microsoft.com/en-us/dotnet/core/tools/global-json)) | `packages.lock.json` |
| Go | `go`/`toolchain` lines older than the installed Go; `GOTOOLCHAIN` auto-switch ([toolchain](https://go.dev/doc/toolchain)) | explicit `toolchain go1.x.y` | `go.sum` (checksums; MVS is deterministic) ([go.sum](https://go.dev/ref/mod#go-sum-files)) |
| Rust | `channel = "stable"` | `channel = "1.xx.y"` ([rustup](https://rust-lang.github.io/rustup/overrides.html)) | `Cargo.lock` ([cargo](https://doc.rust-lang.org/cargo/guide/cargo-toml-vs-cargo-lock.html)) |
| Docker | `latest`, `node:24`, `node:lts` (tags are mutable) | full tag + digest `image:26.1.2-alpine3.22@sha256:…` ([Docker](https://docs.docker.com/build/building/best-practices/#pin-base-image-versions), RN-docker); Renovate `docker:pinDigests` | none; the digest is the lock |
| GitHub Actions | `actions/checkout@v5` (moving major tag), `node-version: lts/*`, `ubuntu-latest` | commit SHA + `# vX.Y.Z` comment (`helpers:pinGitHubActionDigests`), `node-version-file`, `runs-on: ubuntu-24.04` | none |
| Runtimes via version managers | `lts/*` in `.nvmrc`, `python 3` | exact versions in `.nvmrc`, `.python-version`, `.tool-versions`, `mise.toml` | `mise.lock` |
| Terraform | provider `~>` constraints without lock | commit `.terraform.lock.hcl` | `.terraform.lock.hcl` |
| Helm | chart ranges | exact versions | `Chart.lock` |
| Dev containers | Features at major tags | lockfile | `devcontainer-lock.json` (DB-eco) |
| Nix | flake inputs on branches | `flake.lock` | `flake.lock` |

---

## 7. Recommendation

**Renovate can be the single tool across all target platforms.** It is the only maintained option on Azure DevOps (the Dependabot extension was archived on 2026-09-01). It runs natively on GitHub, GitLab, Bitbucket and Forgejo/Gitea. One `renovate.json` plus a shared preset repository works the same everywhere. The decisive gap is runtimes: Dependabot does not update `.nvmrc`, `.node-version`, `engines`, `setup-*` inputs, `.python-version`, `.tool-versions`, `mise.toml` or Go `toolchain`. Its Docker major bumps are not LTS-aware.

Suggested shape for the plugin (the user approves each point):
- `extends: ["config:best-practices"]`: LTS-only Node/Java, digest pinning, dashboard, weekly lock file maintenance, `minimumReleaseAge` for npm.
- Pin exact runtime versions in one file per stack, and have CI read that file (`node-version-file`, `python-version-file`, `global-version-file`/`go-version-file` (unverified input names except node)).
- Add regex custom managers for what has no built-in manager (Gradle toolchain, `maven.compiler.release`).
- Hosting per platform: GitHub can use the Mend Community Cloud app (free) or `renovatebot/github-action`. Azure DevOps can use a scheduled Azure Pipeline running the CLI (or Mend Cloud). GitLab can use `renovate-runner` (or Mend Cloud).

| On GitHub, Renovate instead of Dependabot | |
|---|---|
| **Gained** | runtime and tool files (section 4.1); LTS-aware majors; Dependency Dashboard with approval; built-in automerge; lock file maintenance; groups across ecosystems; regex managers; shared presets; same config on every platform |
| **Lost / weaker** | zero setup (Dependabot is built in, no app or token); transitive security fixes (npm/NuGet) and alert auto-close tied to the GitHub dependency graph; Dependabot compatibility scores; malware alerts. Renovate's free hosted app runs only every 4 h with 1 job per org |
| **Keep on GitHub** | Dependabot **alerts** (and malware alerts) stay on: Renovate's `vulnerabilityAlerts` reads them to open security PRs. Turn off Dependabot **version** updates to avoid duplicate PRs. Whether to also keep Dependabot **security** updates (better for transitive deps, but duplicate PRs are possible) is a choice for the user |
| **Off GitHub** | security PRs come only from Renovate's OSV support (direct deps only), or from the platform's own scanner (GHAzDO alerts, GitLab Ultimate) |
