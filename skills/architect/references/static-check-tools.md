# Architect step: static check tools by layer and stack

Reference list for the architect step. The step asks the user, one check at a time, whether to enable each kind of static check and which tool to use. An agent reads this list to propose options for the project's stacks. The list is a starting point, not a configuration: nothing here is installed or pinned by default, and the agent proposes, the user decides.

Research date: 2026-11-17.

Version numbers are deliberately left out because they go stale. Each tool instead names where its latest version is published, and the agent reads the version from there at the time it sets up the project.

## 0. How to read this file

### 0.1 Markers

- **V**: checked during this research. For tools on GitHub this means the GitHub API on 2026-11-17 showed the repository not archived, with commits in the last six months. For other tools it means the vendor's or project's own page was read.
- **S**: from secondary sources only (press, vendor comparisons, aggregators).
- **K**: from prior knowledge, not re-checked this time. Verify before relying on it.
- **slow**: maintained (recent commits) but the last tagged release is more than a year old, or activity is thin. Fine to use; check again before proposing it as the default.

A row without a marker in its Notes column is **V**.

### 0.2 Column key

- **Layer**: `FMT` formatter; `LINT` linter and coding rules (complexity and length limits included); `TYPE` type checker; `ARCH` architecture and dependency rules; `DUP` duplicate code; `SAST` security static analysis; `SCA` dependency vulnerability scanning; `LIC` license compliance. Secret scanning, container and IaC scanning, commit message linting and git hook managers are language-independent and have their own sections.
- **License**: an SPDX id for open source; `Comm.` commercial; `Freemium` free tier plus paid tiers; `Free (prop.)` free of charge but not open source; `SA` source-available (not an OSI license). `(K)` after a license means it was not re-checked.
- **Fix**: `Y` rewrites the code (formatters, `--fix`); `P` partial (some rules have fixes, or it proposes patches); `N` reports only.
- **Latest at**: where the newest version is published. Shorthands:

| Shorthand | URL pattern |
|---|---|
| `GH:o/r` | https://github.com/o/r/releases (if a project publishes no GitHub releases, its tags page or the registry named next to it) |
| `npm:x` | https://www.npmjs.com/package/x |
| `PyPI:x` | https://pypi.org/project/x/ |
| `crates:x` | https://crates.io/crates/x |
| `Maven:g:a` | https://central.sonatype.com/artifact/g/a |
| `GradlePP:id` | https://plugins.gradle.org/plugin/id |
| `NuGet:x` | https://www.nuget.org/packages/x |
| `Packagist:v/n` | https://packagist.org/packages/v/n |
| `gem:x` | https://rubygems.org/gems/x |
| `Hex:x` | https://hex.pm/packages/x |
| `Hackage:x` | https://hackage.haskell.org/package/x |
| `opam:x` | https://opam.ocaml.org/packages/x/ |
| `Clojars:g/a` | https://clojars.org/g/a |
| `CRAN:x` | https://cran.r-project.org/package=x |
| `JuliaReg:x` | the General registry, https://juliahub.com/ui/Packages/General/x |
| `LuaRocks:x` | https://luarocks.org/search?q=x |
| `CPAN:x` | https://metacpan.org/dist/x |
| `pub:x` | https://pub.dev/packages/x |
| `Go:m` | https://pkg.go.dev/m (versions tab) |
| `PSGallery:x` | https://www.powershellgallery.com/packages/x |
| `Alire:x` | https://alire.ada.dev/crates/x |
| `Nimble:x` | https://nimble.directory/pkg/x |
| `SPI:o/r` | https://swiftpackageindex.com/o/r |
| `Brew:x` | https://formulae.brew.sh/formula/x |
| `Toolchain` | ships with the language toolchain; the toolchain's own download page is the source |

### 0.3 Choosing a tool per layer

- Prefer the tool the language community treats as standard (often bundled with the toolchain) over a newer, faster alternative, unless the user asks for speed or one tool covering several layers.
- One tool per layer per language. Two formatters on the same files fight each other; two linters with overlapping rules produce duplicate findings.
- A layer may have no good tool for a stack. Say so to the user instead of forcing a weak tool in; the gaps are listed in section 6.
- Commercial tools are listed so the user can choose them, never proposed as the default for a project that has not said it pays for tools.

## 1. Language-agnostic and multi-language tools

### 1.1 Aggregators and platforms

| Tool | What it checks | License | Fix | Latest at | CI integration | Notes |
|---|---|---|---|---|---|---|
| MegaLinter | Runs 100+ linters, formatters, SAST, secret, IaC and duplicate (jscpd) tools across ~50 languages in one container | AGPL-3.0 | Y (`APPLY_FIXES`) | GH:oxsecurity/megalinter; Docker Hub `oxsecurity/megalinter` | GitHub Actions, GitLab CI, Azure Pipelines, Bitbucket Pipelines, Jenkins, Concourse, Drone; local via `npx mega-linter-runner` (K for the less common CI) | AGPL covers the tool, not the code it scans. Flavors (per-language images) keep the image small. |
| Super-Linter | Same idea: one container running the standard linter per language | MIT | P (fix mode per linter, K) | GH:super-linter/super-linter | GitHub Actions (primary); runs as a container locally or in other CI (not officially supported, K) | Moved from `github/super-linter` to `super-linter/super-linter`. |
| Trunk Code Quality (formerly Trunk Check) | Meta-linter: installs and runs pinned versions of many linters, hold-the-line (only new issues) | Free (prop.) CLI; plugin definitions MIT | Y (`trunk fmt`, `trunk check --fix`) | https://docs.trunk.io (CLI install); GH:trunk-io/plugins | GitHub Actions (`trunk-io/trunk-action`); any CI via CLI | S: the web dashboard and web-run CI workflows were shut down in 2025; the CLI stays. |
| Qlty CLI | Meta-linter plus duplication, complexity and maintainability metrics | SA (Business Source License 1.1) | Y | GH:qltysh/qlty | GitHub Actions; any CI via CLI; Qlty Cloud for PR comments | Successor of the Code Climate quality tooling. BSL restricts offering it as a competing service. |
| SonarQube Community Build | Bugs, code smells, complexity, duplication, some security rules, quality gates | LGPL-3.0 | N (IDE quick fixes only) | GH:SonarSource/sonarqube; https://www.sonarsource.com/products/sonarqube/downloads/ | GitHub Actions, GitLab CI, Azure DevOps, Bitbucket Pipelines, Jenkins; any CI via SonarScanner CLI | Self-hosted, free. Languages (V, Sonar docs): Java, Kotlin, C#, VB.NET, JS/TS, Python, Go, PHP, HTML/CSS/XML, Flex, Terraform, CloudFormation, ARM, Docker, Kubernetes/Helm, secrets. Ruby, Rust and Scala were removed from version 26.11 (community plugins exist). Main branch only. |
| SonarQube Server (Developer, Enterprise, Data Center) | Adds branches and PR analysis, taint analysis, more languages: C, C++, Obj-C, Swift, Dart, ABAP, T-SQL, PL/SQL (Developer); COBOL, JCL, PL/I, RPG, Apex, VB6 (Enterprise) | Comm. (priced by lines of code) | P (AI CodeFix, Comm.) | https://www.sonarsource.com/products/sonarqube/downloads/ | Same as above, with PR decoration on GitHub, GitLab, Azure DevOps, Bitbucket | S for the edition split; check the current edition table before quoting a price. |
| SonarQube Cloud | Hosted SonarQube | Freemium (free for public projects) | P | https://www.sonarsource.com/products/sonarcloud/ | GitHub, GitLab, Azure DevOps, Bitbucket | K |
| SonarQube for IDE (formerly SonarLint) | The same rules in the editor | LGPL-3.0 (plugins); free | P | VS Code Marketplace, JetBrains Marketplace, Eclipse Marketplace; GH:SonarSource/sonarlint-vscode | n/a (editor) | |
| Semgrep Community Edition | Pattern- and dataflow-based SAST and custom rules for 30+ languages | Engine LGPL-2.1; Semgrep-maintained rules under the Semgrep Rules License (not OSI, limits commercial redistribution) | Y (rules with `fix:`) | GH:semgrep/semgrep; PyPI:semgrep; Docker Hub `semgrep/semgrep` | GitHub Actions, GitLab CI, Jenkins, Bitbucket, Azure Pipelines, CircleCI, Buildkite (sample configs in Semgrep docs, K) | S for the rules license change (Dec 2024). Cross-file taint analysis is in the paid Semgrep Code. |
| Opengrep | Fork of Semgrep CE (early 2025) by several security vendors; runs Semgrep-format rules | LGPL-2.1 | Y | GH:opengrep/opengrep | Any CI via CLI | Pick this when the user wants a fully open rule engine. Bring your own rules or use community rule sets with compatible licenses. |
| CodeQL | Semantic code queries, security and quality, for C/C++, C#, Go, Java/Kotlin, JS/TS, Python, Ruby, Swift, Rust, GitHub Actions workflows (K for the full list) | Queries MIT; CLI free for open source and research, commercial use needs GitHub Code Security | P (Copilot Autofix, Comm.) | GH:github/codeql-cli-binaries; GH:github/codeql-action | GitHub Actions (native code scanning); CLI in Azure Pipelines, Jenkins, GitLab and others with SARIF upload to GitHub (K) | Free on public GitHub repositories. |
| Qodana (JetBrains) | IntelliJ inspections in CI: JVM, .NET, JS/TS, Python, Go, PHP and more, plus license audit | Freemium (Community linters free; Ultimate tiers paid) | P | GH:JetBrains/qodana-cli; https://www.jetbrains.com/qodana/ | GitHub Actions, GitLab CI, Azure Pipelines, Jenkins, TeamCity, CircleCI, Bitbucket (K) | |
| reviewdog | Not a checker: posts any linter's output as PR review comments, filtered to the diff | MIT | n/a | GH:reviewdog/reviewdog | GitHub, GitLab, Bitbucket, Gerrit, Gitea | Useful with tools that lack PR integration. |
| Lizard | Cyclomatic complexity and function length for ~30 languages (C/C++, Java, C#, JS/TS, Python, Go, Rust, Swift, Obj-C, Kotlin, Scala, Lua, Fortran, Erlang, PHP, Ruby, Zig and more, K) | MIT (K) | N | GH:terryyin/lizard; PyPI:lizard | Any CI | A fallback complexity check for stacks whose linter has none. |
| editorconfig-checker | Files follow `.editorconfig` (indentation, line endings, final newline) | MIT | N | GH:editorconfig-checker/editorconfig-checker | Any CI | A formatter of last resort for languages with no formatter. |
| typos / cspell | Spelling in code and docs | typos MIT/Apache-2.0; cspell MIT | P (typos `-w`) | crates:typos-cli; npm:cspell | Any CI | |

### 1.2 Duplicate code

| Tool | Languages | License | Fix | Latest at | CI integration | Notes |
|---|---|---|---|---|---|---|
| jscpd | 150+ formats (token-based, Rabin-Karp) | MIT | N | npm:jscpd; GH:kucherenko/jscpd | Any CI (npm); built into MegaLinter and Super-Linter | Default proposal for most stacks. Thresholds as percentage or count. |
| PMD CPD | Java, Kotlin, Scala, Groovy, C/C++, C#, Obj-C, Swift, Dart, Go, Rust, JS/TS, Python, PHP, Ruby, Lua, Perl, Julia, Fortran, Matlab, PL/SQL, T-SQL, Apex, XML/HTML and more (K for the exact list) | BSD-style | N | GH:pmd/pmd; Maven:net.sourceforge.pmd:pmd-dist | Maven and Gradle plugins; any CI via CLI. `pmd/pmd-github-action` exists but is slow (last commit 2024-10) | Token-based. Good for JVM builds that already run PMD. |
| SonarQube duplication | Every language the edition analyzes | see 1.1 | N | see 1.1 | see 1.1 | Comes with SonarQube; no extra tool. |
| Qlty | Many languages | SA | N | GH:qltysh/qlty | see 1.1 | |
| Language-specific | Pylint `duplicate-code` (Python), dupl (Go, in golangci-lint), Flay (Ruby), Credo `DuplicatedCode` (Elixir) | see language sections | N | see language sections | | |
| Simian | Many languages | Comm. (K) | N | vendor site (K) | | Status not confirmed (S, K). Do not propose without checking. |
| phpcpd | PHP | BSD-3-Clause | N | | | **Dead**: repository archived by its author in 2023. Use jscpd or PMD CPD. |

### 1.3 Security static analysis (SAST), multi-language

Semgrep CE, Opengrep, CodeQL, SonarQube and Qodana are in 1.1. Others:

| Tool | What it checks | License | Fix | Latest at | CI integration | Notes |
|---|---|---|---|---|---|---|
| Snyk Code | SAST for most mainstream languages | Freemium | P (AI fixes) | GH:snyk/cli; npm:snyk | GitHub, GitLab, Azure, Bitbucket, Jenkins, CircleCI (K) | |
| Bearer CLI | SAST with data-flow focus on sensitive data (JS/TS, Ruby, PHP, Java, Go, Python) | Elastic License 2.0 (K; GitHub shows no SPDX id) | N | GH:Bearer/bearer | GitHub Actions, GitLab, any CI | Owned by Cycode (K). |
| Checkmarx One, OpenText Fortify, Veracode, Black Duck Coverity, Perforce Klocwork, CodeSonar | Enterprise SAST | Comm. | P | vendor sites | All major CI | K. Propose only if the organization already licenses one. |
| Horusec | Multi-language SAST orchestrator | Apache-2.0 | | | | **Dead**: last release 2022. Do not propose. |

### 1.4 Dependency vulnerability scanning (SCA), multi-language

| Tool | What it checks | License | Fix | Latest at | CI integration | Notes |
|---|---|---|---|---|---|---|
| OSV-Scanner | Lockfiles and manifests for ~20 ecosystems (npm, PyPI, Maven, Gradle, Go, crates, NuGet, Packagist, RubyGems, Hex, pub, CRAN, Conan, SwiftPM and more, K for the full list), container images, SBOMs, against osv.dev | Apache-2.0 | P (`osv-scanner fix` guided remediation for npm and Maven, K) | GH:google/osv-scanner | GitHub Actions (`google/osv-scanner-action` reusable workflows); any CI via CLI | Good default for polyglot repositories. |
| Trivy | Vulnerabilities in lockfiles, OS packages and images; also IaC misconfiguration, secrets, licenses, SBOM | Apache-2.0 | N | GH:aquasecurity/trivy | GitHub Actions (`aquasecurity/trivy-action`), GitLab CI, Azure DevOps extension, Jenkins, CircleCI (K for the extensions) | **Security note (V, multiple sources):** on 2026-03-19 attackers repointed almost all tags of `aquasecurity/trivy-action` and `setup-trivy` to a credential stealer, and published a malicious release (CVE-2026-33634). Pin actions by commit SHA, not tag. |
| Grype (with Syft) | Vulnerabilities in images, filesystems and SBOMs; Syft generates the SBOM | Apache-2.0 | N | GH:anchore/grype; GH:anchore/syft | GitHub Actions (`anchore/scan-action`); any CI | |
| OWASP Dependency-Check | Java and .NET primarily, plus experimental analyzers for others, against NVD | Apache-2.0 | N | GH:dependency-check/DependencyCheck; Maven:org.owasp:dependency-check-maven | Maven, Gradle, Ant, Jenkins plugin, CLI | Repository moved from `jeremylong/DependencyCheck` (archived) to `dependency-check/DependencyCheck` (active). Needs an NVD API key for speed. |
| OWASP dep-scan | SCA with reachability for many ecosystems | MIT | N | GH:owasp-dep-scan/dep-scan | Any CI | |
| GitHub Dependabot alerts and updates | Alerts and update PRs for the ecosystems GitHub supports | Free on GitHub | Y (update PRs) | https://docs.github.com/code-security/dependabot | GitHub only | |
| Renovate | Dependency update PRs (not a scanner, but closes vulnerabilities by updating) | AGPL-3.0 | Y | GH:renovatebot/renovate; npm:renovate | GitHub, GitLab, Bitbucket, Azure DevOps, Gitea/Forgejo | Mend-hosted app is free. |
| Snyk Open Source, Mend, Black Duck, Sonatype | Commercial SCA | Comm. / Freemium | P | vendor sites | All major CI | K |
| OWASP Dependency-Track | Platform that tracks SBOMs over time | Apache-2.0 | N | GH:DependencyTrack/dependency-track | Any CI uploads SBOMs | Pair with cdxgen or Syft. |
| cdxgen | CycloneDX SBOM generator for most ecosystems | Apache-2.0 | n/a | GH:cdxgen/cdxgen; npm:@cyclonedx/cdxgen | Any CI | Moved from `CycloneDX/cdxgen` to `cdxgen/cdxgen`. |
| nsp | Node Security Platform | | | | | **Dead** since 2018; replaced by `npm audit`. |

### 1.5 License compliance, multi-language

| Tool | What it checks | License | Fix | Latest at | CI integration | Notes |
|---|---|---|---|---|---|---|
| ScanCode Toolkit | Detects licenses and copyrights in source files and packages | Apache-2.0 (code), CC-BY-4.0 (data) (K) | N | GH:aboutcode-org/scancode-toolkit; PyPI:scancode-toolkit | Any CI | Thorough but slow. Repository moved from `nexB`. |
| OSS Review Toolkit (ORT) | Full pipeline: dependency analysis, license scan, policy rules, reports | Apache-2.0 | N | GH:oss-review-toolkit/ort | Any CI; GitHub Action and GitLab templates exist (K) | Heavy; suited to organizations with a license policy. |
| Trivy license scan | License of each dependency and of files | Apache-2.0 | N | see 1.4 | see 1.4 | Simple policy by license category. |
| Grant (Anchore) | License policy check over SBOMs or images | Apache-2.0 | N | GH:anchore/grant | Any CI | |
| REUSE tool | Every file carries SPDX license and copyright info (REUSE specification) | GPL-3.0 and others (K) | P (`reuse annotate`) | GH:fsfe/reuse-tool; PyPI:reuse | Any CI; pre-commit hook | For the project's own files, not its dependencies. |
| licensee | Detects a repository's own license | MIT | N | GH:licensee/licensee; gem:licensee | Any CI | |
| FOSSA | License and SCA platform | Freemium (CLI open, K) | N | GH:fossas/fossa-cli | All major CI (K) | |
| Qodana license audit | Dependency licenses for JVM, JS, PHP, Python, Go (K) | Comm. tier | N | see 1.1 | see 1.1 | |
| LicenseFinder (Pivotal) | Dependency licenses across many package managers | MIT | N | GH:pivotal/LicenseFinder | | slow: last commit 2024-07, last release 2024-05. Prefer ORT, Trivy or a per-ecosystem tool. |

## 2. Languages and stacks

### 2.1 TypeScript and JavaScript (Node, React, Vue, Angular)

| Layer | Tool | What it checks | License | Fix | Latest at | Notes |
|---|---|---|---|---|---|---|
| FMT | Prettier | JS, TS, JSX, CSS, HTML, Vue, Angular templates, Markdown, YAML, JSON, GraphQL | MIT | Y | npm:prettier | Default. Plugins add PHP, Java, Solidity, etc. |
| FMT+LINT | Biome | Formatter (Prettier-compatible) and linter for JS/TS/JSX/JSON/CSS/GraphQL; HTML, Vue, Svelte partial (K) | MIT/Apache-2.0 | Y | npm:@biomejs/biome | One fast tool instead of ESLint+Prettier; fewer plugins. Successor of Rome. |
| FMT | oxfmt (Oxc) | Prettier-compatible formatter | MIT | Y | npm:oxfmt | S: beta in 2026, no stable 1.0 found. |
| FMT | dprint | Pluggable formatter (TS/JS, JSON, Markdown, TOML, Dockerfile; can wrap Prettier) | MIT | Y | GH:dprint/dprint; npm:dprint | |
| LINT | ESLint | Rules incl. `complexity`, `max-depth`, `max-lines`, `max-lines-per-function`, `max-params`, `max-statements` | MIT | P | npm:eslint | Default. Flat config. |
| LINT | typescript-eslint | Type-aware TS rules for ESLint | MIT | P | npm:typescript-eslint | |
| LINT | Oxlint | Rust linter with most ESLint core and plugin rules; type-aware rules via tsgolint | MIT | P | npm:oxlint | V (Oxc blog, 2026-07): type-aware linting declared stable. |
| LINT | angular-eslint | Angular TS and template rules | MIT | P | npm:angular-eslint | Angular's official lint path (`ng lint`). |
| LINT | eslint-plugin-vue | Vue SFC rules | MIT | P | npm:eslint-plugin-vue | |
| LINT | eslint-plugin-react, eslint-plugin-react-hooks | React and hooks rules | MIT | P | npm:eslint-plugin-react; npm:eslint-plugin-react-hooks | react-hooks lives in the React repository (K). eslint-plugin-react last tagged GitHub release 2025-04 (slow on GitHub; check npm). |
| LINT | eslint-plugin-n | Node.js rules | MIT (K) | P | npm:eslint-plugin-n | K |
| LINT | eslint-plugin-import-x | Import order, unresolved and cyclic imports | MIT | P | npm:eslint-plugin-import-x | Faster fork of eslint-plugin-import (also still maintained). |
| LINT | @stylistic/eslint-plugin | Formatting-style rules removed from ESLint core | MIT | Y | npm:@stylistic/eslint-plugin | Only if no formatter is used. |
| LINT | eslint-plugin-sonarjs | Sonar rules incl. cognitive complexity | LGPL-3.0 (K) | P | npm:eslint-plugin-sonarjs | |
| LINT | Stylelint | CSS, SCSS, Less | MIT | P | npm:stylelint | |
| LINT | Knip | Unused files, exports and dependencies | ISC | P (`--fix`) | npm:knip | |
| LINT | XO, JS Standard | Opinionated ESLint wrappers | MIT | P | npm:xo; npm:standard | standard: slow (last release 2024-09). |
| TYPE | TypeScript `tsc --noEmit` | Type checking | Apache-2.0 | N | npm:typescript | S: the native (Go) compiler shipped as TypeScript 7 in 2026. |
| TYPE | vue-tsc | Type checking for Vue SFCs | MIT | N | npm:vue-tsc | Part of vuejs/language-tools. |
| TYPE | Angular compiler strict templates | Template type checking (`strictTemplates`) | MIT | N | npm:@angular/compiler-cli | Runs during `ng build`. |
| ARCH | dependency-cruiser | Dependency rules (forbidden, allowed, cycles, orphans) for JS/TS, with graphs | MIT | N | npm:dependency-cruiser | Default for Node and generic repositories. |
| ARCH | eslint-plugin-boundaries | Element types and allowed imports between them, as ESLint rules | MIT | N | npm:eslint-plugin-boundaries | |
| ARCH | Sheriff | Module boundaries and dependency rules via tags, mainly for Angular | MIT | N | npm:@softarc/sheriff-core; GH:sheriff-arch/sheriff | Repository moved to `sheriff-arch/sheriff`. |
| ARCH | Nx `@nx/enforce-module-boundaries` | Tag-based boundaries between projects in an Nx workspace | MIT | N | npm:@nx/eslint-plugin | Only for Nx workspaces. |
| ARCH | ArchUnitTS | ArchUnit-style tests for TS (layers, cycles, naming, metrics) | MIT | N | npm:archunit | |
| ARCH | ts-arch (tsarch) | ArchUnit-style tests for TS | MIT | N | npm:tsarch | slow: last release 2024-12. Prefer ArchUnitTS. |
| ARCH | madge | Dependency graph and circular dependency detection | MIT | N | npm:madge | Cycles only, no rules. |
| DUP | jscpd | see 1.2 | | | | |
| SAST | eslint-plugin-security | Risky Node patterns | Apache-2.0 | N | npm:eslint-plugin-security | |
| SAST | njsscan | Node.js SAST (Semgrep- and libsast-based) | LGPL-3.0 | N | PyPI:njsscan | |
| SAST | Semgrep, CodeQL, SonarQube | see 1.1 | | | | |
| SCA | `npm audit`, `pnpm audit`, `yarn npm audit` | Vulnerable dependencies | Toolchain | P (`npm audit fix`) | Toolchain | |
| SCA | OSV-Scanner, Trivy, Snyk, Socket (supply-chain behavior, Freemium, K) | see 1.4 | | | | |
| LIC | license-checker-rseidelsohn | Dependency licenses, allow and deny lists | BSD-3-Clause | N | npm:license-checker-rseidelsohn | Maintained fork; the original `license-checker` is stale (last commit 2024-01). |

Dead in this ecosystem: **TSLint** (archived 2021, use typescript-eslint), **Rome** (archived 2023, continued as Biome), **JSCS** (archived, merged into ESLint), **JSHint** is still online but slow (last commit 2025-02).

### 2.2 Java

| Layer | Tool | What it checks | License | Fix | Latest at | Notes |
|---|---|---|---|---|---|---|
| FMT | google-java-format | Google style | Apache-2.0 | Y | GH:google/google-java-format; Maven:com.google.googlejavaformat:google-java-format | |
| FMT | palantir-java-format | google-java-format variant with 120 columns and lambda-friendly layout | Apache-2.0 | Y | GH:palantir/palantir-java-format | |
| FMT | Spotless | Build plugin that runs formatters (the two above, Eclipse JDT, Prettier, ktlint, etc.) for Maven and Gradle | Apache-2.0 | Y | GradlePP:com.diffplug.spotless; Maven:com.diffplug.spotless:spotless-maven-plugin | Usual way to wire formatters into the build. |
| FMT | prettier-plugin-java | Prettier for Java | Apache-2.0 | Y | npm:prettier-plugin-java | |
| LINT | Checkstyle | Coding conventions; `CyclomaticComplexity`, `MethodLength`, `FileLength`, `ParameterNumber` | LGPL-2.1 | N | GH:checkstyle/checkstyle; Maven:com.puppycrawl.tools:checkstyle | |
| LINT | PMD | Bug patterns, design rules, `CyclomaticComplexity`, `CognitiveComplexity`, `NcssCount` | BSD-style | N | GH:pmd/pmd | |
| LINT | Error Prone | Compiler plugin: bug patterns at compile time | Apache-2.0 | P (suggested patches) | Maven:com.google.errorprone:error_prone_core | |
| LINT | SpotBugs | Bytecode bug patterns | LGPL-2.1 | N | GH:spotbugs/spotbugs | Successor of FindBugs. |
| LINT | OpenRewrite | Automated refactoring and migration recipes (not a linter, but fixes at scale) | Apache-2.0 core; many recipes under the Moderne Source Available License (K) | Y | GH:openrewrite/rewrite | |
| LINT | Qodana / IntelliJ inspections, SonarQube | see 1.1 | | | | |
| TYPE | javac with `-Xlint:all -Werror` | Compiler warnings as errors | Toolchain | N | Toolchain | |
| TYPE | NullAway | Fast nullness checking (Error Prone plugin) | MIT | N | Maven:com.uber.nullaway:nullaway | |
| TYPE | Checker Framework | Pluggable type systems (nullness, units, locks, etc.) | GPL-2.0 with classpath exception (K) | N | GH:typetools/checker-framework | |
| ARCH | ArchUnit | Architecture tests: layers, slices, cycles, naming, annotations | Apache-2.0 | N | Maven:com.tngtech.archunit:archunit | Default. Works on bytecode, so also covers Kotlin and Scala classes. |
| ARCH | Spring Modulith | Module boundaries in Spring Boot apps (verify, document) | Apache-2.0 | N | Maven:org.springframework.modulith:spring-modulith-core | Spring only. |
| ARCH | jMolecules | Annotations for DDD, layers, hexagonal; ArchUnit rules verify them | Apache-2.0 | N | GH:xmolecules/jmolecules | |
| ARCH | Maven Enforcer `bannedDependencies` | Which artifacts a module may depend on | Apache-2.0 | N | Maven:org.apache.maven.plugins:maven-enforcer-plugin | Module-level, not package-level. |
| DUP | PMD CPD, jscpd | see 1.2 | | | | |
| SAST | SpotBugs + Find Security Bugs | Security bug patterns (injection, crypto, etc.) | LGPL-3.0 | N | Maven:com.h3xstream.findsecbugs:findsecbugs-plugin | Last release 2025-06 (V). |
| SAST | Semgrep, CodeQL, SonarQube | see 1.1 | | | | |
| SCA | OWASP Dependency-Check, OSV-Scanner, Trivy, Snyk | see 1.4 | | | | |
| LIC | license-maven-plugin (MojoHaus) | Third-party license report and checks | LGPL-3.0 | N | Maven:org.codehaus.mojo:license-maven-plugin | |
| LIC | Gradle License Report | License report and allowed-license checks | Apache-2.0 | N | GradlePP:com.github.jk1.dependency-license-report | |

### 2.3 Kotlin (JVM, Android, Multiplatform)

| Layer | Tool | What it checks | License | Fix | Latest at | Notes |
|---|---|---|---|---|---|---|
| FMT+LINT | ktlint | Kotlin coding conventions; formats | MIT | Y | GH:pinterest/ktlint redirects to GH:ktlint/ktlint; Maven:com.pinterest.ktlint:ktlint-cli | |
| FMT | ktfmt | google-java-format-style formatter for Kotlin | Apache-2.0 | Y | GH:facebook/ktfmt redirects to GH:Kotlin/ktfmt | Moved to the Kotlin organization. |
| FMT | ktlint-gradle | Gradle plugin for ktlint | MIT | Y | GradlePP:org.jlleitschuh.gradle.ktlint | |
| LINT | detekt | Code smells, `CyclomaticComplexMethod`, `LongMethod`, `LargeClass`, `LongParameterList`; formatting rule set wraps ktlint | Apache-2.0 | P | GH:detekt/detekt; GradlePP:io.gitlab.arturbosch.detekt | Last stable GitHub release 2025-02; 2.0 in progress (check). |
| LINT | Android Lint | Android-specific correctness, performance, security | Apache-2.0 | P | ships with the Android Gradle Plugin | K |
| LINT | diktat | Strict Kotlin rules on top of ktlint | MIT | Y | GH:saveourtool/diktat | slow (last commit 2026-06). |
| TYPE | kotlinc with `allWarningsAsErrors` | Compiler | Toolchain | N | Toolchain | |
| ARCH | Konsist | Architecture and convention tests over Kotlin source (layers, naming, declarations) | Apache-2.0 | N | Maven:com.lemonappdev:konsist | Default for Kotlin. Source-based, so it also works for Android and KMP. |
| ARCH | ArchUnit | Bytecode architecture tests | Apache-2.0 | N | see 2.2 | |
| DUP | PMD CPD, jscpd | see 1.2 | | | | |
| SAST | CodeQL (Kotlin supported), Semgrep, SonarQube, MobSF for Android apps (GPL-3.0, K) | see 1.1 | | | | |
| SCA, LIC | as Java (2.2), plus Dependabot and OSV-Scanner for Gradle lockfiles | | | | | |

### 2.4 C# and .NET

| Layer | Tool | What it checks | License | Fix | Latest at | Notes |
|---|---|---|---|---|---|---|
| FMT+LINT | `dotnet format` | Whitespace, code style and analyzer fixes driven by `.editorconfig` | MIT | Y | Toolchain (.NET SDK) | Default. The old `dotnet/format` repository is merged into the SDK. |
| FMT | CSharpier | Opinionated Prettier-style formatter | MIT | Y | NuGet:CSharpier; GH:belav/csharpier | |
| LINT | .NET analyzers (Microsoft.CodeAnalysis.NetAnalyzers, CAxxxx and IDExxxx) | Quality, style, security, `CA1502` excessive complexity | MIT | P (code fixes) | Toolchain (.NET SDK); NuGet:Microsoft.CodeAnalysis.NetAnalyzers | The `dotnet/roslyn-analyzers` repository is archived; the analyzers ship with the SDK. Set `AnalysisLevel` and `TreatWarningsAsErrors`. |
| LINT | StyleCop.Analyzers | StyleCop rules as Roslyn analyzers | MIT | P | NuGet:StyleCop.Analyzers | |
| LINT | Roslynator | 500+ analyzers, refactorings and a CLI | Apache-2.0 (K) | P | NuGet:Roslynator.Analyzers; GH:dotnet/roslynator | Moved to the dotnet organization. |
| LINT | Meziantou.Analyzer | Best-practice analyzers | MIT | P | NuGet:Meziantou.Analyzer | |
| LINT | SonarAnalyzer.CSharp | Sonar rules incl. cognitive complexity, as NuGet analyzers | SA (Sonar Source-Available License, K) | P | NuGet:SonarAnalyzer.CSharp | |
| LINT | ReSharper Command Line Tools (InspectCode, CleanupCode) | JetBrains inspections and cleanup | Free (prop.) | Y | NuGet:JetBrains.ReSharper.GlobalTools | K |
| TYPE | C# compiler with nullable reference types, `TreatWarningsAsErrors` | Compiler | Toolchain | N | Toolchain | |
| ARCH | ArchUnitNET | Architecture tests over assemblies (layers, dependencies, naming) | Apache-2.0 | N | NuGet:TngTech.ArchUnitNET | Default. |
| ARCH | NetArchTest.eNhancedEdition | Fluent architecture tests (fork of NetArchTest) | MIT | N | NuGet:NetArchTest.eNhancedEdition | slow: last release 2025-06. The original `NetArchTest.Rules` has had no release since 2021; prefer this fork or ArchUnitNET. |
| ARCH | NsDepCop | Namespace and assembly dependency rules as a Roslyn analyzer | GPL-2.0 | N | NuGet:NsDepCop | |
| DUP | jscpd, PMD CPD, SonarQube | see 1.2 | | | | |
| SAST | .NET security analyzers (CA2100, CA3xxx, CA5xxx) | Injection, crypto, deserialization | MIT | N | Toolchain | |
| SAST | CodeQL, Semgrep, SonarQube | see 1.1 | | | | |
| SAST | Security Code Scan | Roslyn security analyzer | LGPL-3.0 | | | **Unmaintained**: last release 2022, last commit 2024-07. Do not propose. |
| SCA | NuGet Audit (on restore), `dotnet list package --vulnerable` | Vulnerable packages from the GitHub Advisory Database | Toolchain | N | Toolchain | Default; built in. |
| SCA | OSV-Scanner, Trivy, Dependabot, Snyk | see 1.4 | | | | |
| LIC | nuget-license | Package license report and allow list | Apache-2.0 (K) | N | NuGet:nuget-license (K) | K |
| HOOK | Husky.Net | Git hooks for .NET repositories | MIT | n/a | NuGet:Husky | |

### 2.5 F#

| Layer | Tool | What it checks | License | Fix | Latest at | Notes |
|---|---|---|---|---|---|---|
| FMT | Fantomas | Formatter (default for F#) | Apache-2.0 (K) | Y | NuGet:fantomas | |
| LINT | FSharpLint | Rules incl. cyclomatic complexity and maximum function length | MIT | P | NuGet:dotnet-fsharplint | |
| LINT | FSharp.Analyzers.SDK + G-Research F# analyzers | Custom analyzers framework and a rule set | MIT; Apache-2.0 | P | NuGet:fsharp-analyzers; NuGet:G-Research.FSharp.Analyzers | |
| TYPE | F# compiler, warnings as errors | Compiler | Toolchain | N | Toolchain | |
| ARCH | ArchUnitNET | Works on compiled F# assemblies | Apache-2.0 | N | see 2.4 | K: F#-specific constructs map imperfectly. |
| DUP, SAST, SCA, LIC | as .NET (2.4) | | | | | CodeQL and Sonar have no F# analyzer (K). |

### 2.6 Python

| Layer | Tool | What it checks | License | Fix | Latest at | Notes |
|---|---|---|---|---|---|---|
| FMT+LINT | Ruff | Formatter (Black-compatible) and 800+ lint rules incl. `C901` complexity, `PLR0915` too many statements, isort, pyupgrade, bandit (`S`) | MIT | Y | PyPI:ruff | Default. One tool covers formatter, linter and import order. |
| FMT | Black | Opinionated formatter | MIT | Y | PyPI:black | |
| FMT | isort | Import order | MIT | Y | PyPI:isort | |
| LINT | Pylint | Deep lint, `too-many-*` limits, `duplicate-code` | GPL-2.0 | N | PyPI:pylint | |
| LINT | Flake8 (+ mccabe, plugins) | Style and complexity | MIT | N | PyPI:flake8 | |
| LINT | wemake-python-styleguide | Strict Flake8 plugin set | MIT | N | PyPI:wemake-python-styleguide | |
| LINT | vulture | Dead code | MIT | N | PyPI:vulture | |
| TYPE | mypy | Static types | MIT | N | PyPI:mypy | Reference checker. |
| TYPE | Pyright | Static types, fast, also the Pylance engine | MIT | N | npm:pyright; PyPI:pyright | |
| TYPE | ty (Astral) | Static types, Rust, very fast | MIT | N | PyPI:ty | K for maturity: check whether it is still labeled beta. |
| TYPE | Pyrefly (Meta) | Static types, Rust | MIT | N | PyPI:pyrefly; GH:pyrefly-org/pyrefly | S: 1.0 released 2026-05. Successor of Pyre. |
| ARCH | import-linter | Contracts: layers, independence, forbidden imports | BSD-2-Clause | N | PyPI:import-linter | Default. Repository moved to `import-linter/import-linter`. |
| ARCH | pytestarch | ArchUnit-style architecture tests in pytest | Apache-2.0 | N | PyPI:pytestarch | |
| ARCH | Tach | Module boundaries and public interfaces, Rust-based | MIT | N | PyPI:tach; GH:tach-org/tach | Was briefly unmaintained under `gauge-sh`; now maintained under `tach-org` (V, S). |
| DUP | Pylint `duplicate-code`, jscpd, PMD CPD | see 1.2 | | | | |
| SAST | Bandit | Security issues in Python AST | Apache-2.0 | N | PyPI:bandit | Ruff's `S` rules port most of it. |
| SAST | Semgrep, CodeQL, SonarQube | see 1.1 | | | | |
| SCA | pip-audit | Vulnerable packages from PyPI advisories and OSV | Apache-2.0 | P (`--fix`) | PyPI:pip-audit | Default. |
| SCA | Safety CLI | Vulnerable packages | Freemium (account required, K) | P | PyPI:safety | |
| SCA | OSV-Scanner, Trivy | see 1.4 | | | | Read `uv.lock`, `poetry.lock`, `requirements.txt` (K for uv). |
| LIC | pip-licenses | License report and allow list | MIT | N | PyPI:pip-licenses | |

Dead or retired: **pytype** (Google; repository archived, last Python version supported is 3.12), **Pyre** (Meta; repository archived, replaced by Pyrefly; the Pysa taint analyzer was split out, K).

### 2.7 Go

| Layer | Tool | What it checks | License | Fix | Latest at | Notes |
|---|---|---|---|---|---|---|
| FMT | gofmt / `go fmt` | Canonical formatting | BSD-3-Clause | Y | Toolchain | Default. |
| FMT | goimports | gofmt plus import management | BSD-3-Clause | Y | Go:golang.org/x/tools/cmd/goimports | |
| FMT | gofumpt | Stricter gofmt | BSD-3-Clause | Y | Go:mvdan.cc/gofumpt | |
| LINT | golangci-lint | Runs 100+ linters incl. gocyclo, gocognit, funlen, lll, dupl, depguard, gosec, errcheck, revive, staticcheck | GPL-3.0 | P (`--fix`) | GH:golangci/golangci-lint | Default. Install the binary, not via `go install` (project advice, K). |
| LINT | `go vet` | Suspicious constructs | BSD-3-Clause | N | Toolchain | |
| LINT | staticcheck | Bugs, simplifications, deprecated APIs | MIT | N | GH:dominikh/go-tools | |
| LINT | revive | Configurable successor of golint | MIT | N | GH:mgechev/revive (now `revive-lint/revive`) | |
| TYPE | Go compiler | | Toolchain | N | Toolchain | |
| ARCH | depguard | Allowed and denied packages per file set (in golangci-lint) | GPL-3.0 | N | GH:OpenPeeDeeP/depguard | Last tag 2023-03 but maintained (commits 2026-11); use through golangci-lint. |
| ARCH | go-arch-lint | Component layers and allowed dependencies from a YAML spec | MIT | N | GH:fe3dback/go-arch-lint | |
| ARCH | arch-go | Architecture tests: dependencies, contents, naming, function limits | MIT | N | GH:arch-go/arch-go | |
| DUP | dupl (in golangci-lint), jscpd | | MIT | N | GH:mibk/dupl | |
| SAST | gosec | Security rules (in golangci-lint too) | Apache-2.0 | N | GH:securego/gosec | |
| SAST | CodeQL, Semgrep, SonarQube | see 1.1 | | | | |
| SCA | govulncheck | Vulnerabilities in the Go vulnerability database, filtered to code actually called | BSD-3-Clause | N | Go:golang.org/x/vuln/cmd/govulncheck | Default. |
| SCA | OSV-Scanner, Trivy, Grype | see 1.4 | | | | |
| LIC | go-licenses | Dependency licenses and checks | Apache-2.0 | N | GH:google/go-licenses | Last release 2025-09. |

### 2.8 Rust

| Layer | Tool | What it checks | License | Fix | Latest at | Notes |
|---|---|---|---|---|---|---|
| FMT | rustfmt (`cargo fmt`) | Formatting | MIT/Apache-2.0 | Y | Toolchain (rustup component) | Default. |
| LINT | Clippy (`cargo clippy`) | 750+ lints incl. `cognitive_complexity`, `too_many_lines`, `too_many_arguments` | MIT/Apache-2.0 | P (`--fix`) | Toolchain (rustup component) | Default. |
| LINT | cargo-machete, cargo-udeps | Unused dependencies | MIT; MIT/Apache-2.0 (K) | P (machete `--fix`) | crates:cargo-machete; crates:cargo-udeps | udeps needs nightly. |
| TYPE | rustc | Compiler; `#![deny(warnings)]` or `RUSTFLAGS=-D warnings` | Toolchain | N | Toolchain | |
| ARCH | Crates and visibility | Module boundaries are usually enforced by splitting into workspace crates and `pub(crate)` | Toolchain | N | | No mainstream ArchUnit-like tool (see section 6). |
| ARCH | cargo-deny `bans` | Banned and duplicate crates, allowed sources | MIT/Apache-2.0 | N | crates:cargo-deny | |
| ARCH | cargo-modules | Module tree and dependency graph, orphan files | MPL-2.0 | N | crates:cargo-modules | Inspection, not enforcement. |
| DUP | jscpd, PMD CPD | see 1.2 | | | | |
| SAST | Clippy (suspicious, correctness), cargo-geiger (unsafe usage) | | MIT/Apache-2.0 (K) | N | crates:cargo-geiger | |
| SAST | CodeQL (Rust support, K for GA status), Semgrep | see 1.1 | | | | |
| SCA | cargo-audit | RustSec advisory database | MIT/Apache-2.0 | P (`cargo audit fix`, experimental) | crates:cargo-audit; GH:rustsec/rustsec | Default. |
| SCA | cargo-deny `advisories` | Same database, inside cargo-deny | MIT/Apache-2.0 | N | crates:cargo-deny | One tool for SCA, licenses and bans. |
| LIC | cargo-deny `licenses`, cargo-about | License policy; attribution file | MIT/Apache-2.0 | N | crates:cargo-deny; crates:cargo-about | |
| HOOK | cargo-husky | Hooks installed by cargo | MIT | n/a | | slow: last commit 2024-07. **rusty-hook** is dead (last commit 2023-02). Prefer pre-commit, prek or lefthook. |

### 2.9 PHP

| Layer | Tool | What it checks | License | Fix | Latest at | Notes |
|---|---|---|---|---|---|---|
| FMT | PHP-CS-Fixer | PER/PSR-12 and custom style | MIT | Y | Packagist:friendsofphp/php-cs-fixer | Default for non-Laravel. |
| FMT+LINT | PHP_CodeSniffer (phpcs, phpcbf) | Coding standards; phpcbf fixes | BSD-3-Clause | Y | Packagist:squizlabs/php_codesniffer; GH:PHPCSStandards/PHP_CodeSniffer | Maintained by PHPCSStandards since 2023; the old squizlabs repository is abandoned, the Packagist name is unchanged (K). |
| FMT | Laravel Pint | PHP-CS-Fixer preset for Laravel | MIT | Y | Packagist:laravel/pint | Default for Laravel. |
| LINT | PHPMD | Complexity (cyclomatic, NPath), length, unused code | BSD-3-Clause | N | Packagist:phpmd/phpmd | |
| LINT | Rector | Automated refactoring and upgrades | MIT | Y | Packagist:rector/rector | |
| LINT | PHPCompatibility | Cross-version compatibility (phpcs standard) | LGPL-3.0 | N | Packagist:phpcompatibility/php-compatibility | |
| TYPE | PHPStan | Static analysis levels 0-10 | MIT | N | Packagist:phpstan/phpstan | Default. Larastan adds Laravel. |
| TYPE | Psalm | Static types plus taint analysis | MIT | P (Psalter) | Packagist:vimeo/psalm | Maintained (commits 2026-11). |
| TYPE | Larastan | PHPStan extension for Laravel | MIT | N | Packagist:larastan/larastan | |
| ARCH | Deptrac | Layers and allowed dependencies from YAML | MIT | N | Packagist:deptrac/deptrac; GH:deptrac/deptrac | Moved from `qossmic/deptrac` (that repository is archived). |
| ARCH | PHPArkitect | Architecture rules as PHP code | MIT | N | Packagist:phparkitect/phparkitect | |
| ARCH | Pest `arch()` | Architecture expectations in Pest tests | MIT | N | Packagist:pestphp/pest-plugin-arch | |
| DUP | jscpd, PMD CPD | see 1.2 | | | | phpcpd is dead (1.2). |
| SAST | Psalm taint analysis, Semgrep, SonarQube | | | | | |
| SCA | `composer audit` | Vulnerable packages (Packagist advisories) | MIT | N | Toolchain (Composer 2.4+) | Default. |
| SCA | roave/security-advisories | Composer conflict list that blocks installing vulnerable versions | MIT | n/a | Packagist:roave/security-advisories | |
| SCA | OSV-Scanner, Trivy | see 1.4 | | | | **local-php-security-checker** is dead (archived 2024). |
| LIC | `composer licenses`, ORT, Trivy | | | | | |
| HOOK | CaptainHook, GrumPHP | Git hooks from Composer | MIT | n/a | Packagist:captainhook/captainhook; Packagist:phpro/grumphp | |

### 2.10 Ruby

| Layer | Tool | What it checks | License | Fix | Latest at | Notes |
|---|---|---|---|---|---|---|
| FMT+LINT | RuboCop | Style, lint, `Metrics/CyclomaticComplexity`, `MethodLength`, `ClassLength`, `AbcSize`; plugins for Rails, RSpec, performance | MIT | Y | gem:rubocop | Default. |
| FMT+LINT | Standard | Zero-config RuboCop preset | MIT | Y | gem:standard | Releases go to RubyGems; GitHub releases stopped in 2023. |
| LINT | Reek | Code smells | MIT | N | gem:reek | |
| LINT | erb_lint | ERB templates | MIT | P | gem:erb_lint | |
| LINT | RubyCritic | Report combining Reek, Flay and complexity | MIT | N | gem:rubycritic | |
| TYPE | Sorbet | Gradual static types (inline sigs, RBI) | Apache-2.0 | P | gem:sorbet | |
| TYPE | Steep + RBS | Static types from RBS signatures | MIT; BSD-2-Clause/Ruby (K) | N | gem:steep; gem:rbs | |
| ARCH | Packwerk | Package boundaries and dependency declarations in large Rails apps | MIT | N | gem:packwerk | Privacy checks moved to an extension (K). |
| DUP | Flay | Structural duplication | MIT | N | gem:flay | |
| SAST | Brakeman | Rails security | Brakeman Public Use License (free to use, restrictions on commercial redistribution, K) | N | gem:brakeman | Default for Rails. |
| SAST | Semgrep, CodeQL | see 1.1 | | | | SonarQube Community Build dropped Ruby in 26.11. |
| SCA | bundler-audit | Gemfile.lock against ruby-advisory-db | GPL-3.0 | N | gem:bundler-audit | Default. |
| SCA | OSV-Scanner, Trivy | see 1.4 | | | | |
| LIC | LicenseFinder | | MIT | N | gem:license_finder | slow (see 1.5). |
| HOOK | Overcommit | Ruby git hook manager | MIT | n/a | gem:overcommit | lefthook is popular in Rails too. |

### 2.11 Swift

| Layer | Tool | What it checks | License | Fix | Latest at | Notes |
|---|---|---|---|---|---|---|
| FMT | swift-format (Apple) | Formatter and some lint rules; `swift format` in the toolchain | Apache-2.0 | Y | Toolchain (Swift 6+); GH:swiftlang/swift-format | |
| FMT | SwiftFormat | Configurable formatter | MIT | Y | GH:nicklockwood/SwiftFormat; Brew:swiftformat | Default in many iOS teams. |
| LINT | SwiftLint | Style and lint, `cyclomatic_complexity`, `function_body_length`, `file_length`, `type_body_length` | MIT | P (`--fix`) | GH:realm/SwiftLint; Brew:swiftlint | Default. |
| TYPE | Swift compiler, strict concurrency checking, warnings as errors | | Toolchain | N | Toolchain | |
| ARCH | Harmonize | Architecture tests for Swift (Konsist-style) | Apache-2.0 | N | SPI:perrystreetsoftware/Harmonize | Small project; check activity before proposing. |
| ARCH | SwiftPM target dependencies | Module boundaries via separate targets | Toolchain | N | | Common approach. |
| DUP | jscpd, PMD CPD | see 1.2 | | | | |
| SAST | CodeQL (Swift supported), Semgrep, SonarQube Server (Comm.), MobSF (iOS apps, K) | | | | | |
| SCA | OSV-Scanner, Trivy, Dependabot (SwiftPM) | see 1.4 | | | | K for SwiftPM support details. |
| LIC | LicensePlist | Acknowledgements and license list for iOS apps | MIT | n/a | GH:mono0926/LicensePlist | Generates attribution, not a policy check. |

**Periphery** (unused-code detection) became a commercial product in 2026; the open-source repository is archived (V, its README).

### 2.12 Objective-C

| Layer | Tool | What it checks | License | Fix | Latest at | Notes |
|---|---|---|---|---|---|---|
| FMT | clang-format | Formatting | Apache-2.0 with LLVM exception | Y | GH:llvm/llvm-project | |
| LINT | clang-tidy | Lint checks incl. `readability-function-cognitive-complexity`, `readability-function-size`, `objc-*` | Apache-2.0 with LLVM exception | P | GH:llvm/llvm-project | |
| LINT | Clang Static Analyzer (Xcode Analyze, `scan-build`) | Path-sensitive bug finding | Apache-2.0 with LLVM exception | N | Toolchain (Xcode, LLVM) | |
| LINT | OCLint | Complexity, length, code smells | BSD-3-Clause | N | GH:oclint/oclint | Last release 2026-02. |
| LINT | Infer (Meta) | Null dereference, leaks, races | MIT | N | GH:facebook/infer (now `meta/infer`) | |
| TYPE | clang with `-Wall -Werror`, nullability annotations | | Toolchain | N | Toolchain | |
| SAST | SonarQube Server (Comm.), Infer | | | | | CodeQL has no official Objective-C support (K). |
| SCA | Trivy, OSV-Scanner for CocoaPods `Podfile.lock` (K) | see 1.4 | | | | |

### 2.13 Dart and Flutter

| Layer | Tool | What it checks | License | Fix | Latest at | Notes |
|---|---|---|---|---|---|---|
| FMT | `dart format` | Formatting | BSD-3-Clause | Y | Toolchain (Dart SDK) | Default. |
| LINT | `dart analyze` / `flutter analyze` with `package:lints` or `flutter_lints` | Analyzer diagnostics and lint rules from `analysis_options.yaml` | BSD-3-Clause | Y (`dart fix --apply`) | Toolchain; pub:lints; pub:flutter_lints | Default. The standalone `dart-lang/linter` repository is archived; rules live in the SDK. |
| LINT | DCM (Dart Code Metrics) | Metrics (complexity, length), extra rules, unused code, banned imports | Comm. (free tier, K) | P | https://dcm.dev | The original open-source `dart_code_metrics` was discontinued; DCM is the commercial continuation. |
| LINT | solid_lints | Opinionated rule set incl. complexity and length metrics | (K) | P | pub:solid_lints | |
| TYPE | Dart analyzer (sound null safety) | | Toolchain | N | Toolchain | |
| ARCH | DCM `avoid-banned-imports` and layer rules, or analyzer plugins | | | | | Weak area (section 6). **custom_lint** (invertase) is archived (2026-03). |
| DUP | jscpd, PMD CPD | see 1.2 | | | | |
| SAST | Semgrep (Dart, K for maturity), SonarQube Server (Comm.) | | | | | |
| SCA | OSV-Scanner (`pubspec.lock`), Dependabot (pub) | see 1.4 | | | | |

### 2.14 C and C++ (including embedded and MISRA)

| Layer | Tool | What it checks | License | Fix | Latest at | Notes |
|---|---|---|---|---|---|---|
| FMT | clang-format | Formatting | Apache-2.0 with LLVM exception | Y | GH:llvm/llvm-project; PyPI:clang-format (wheels) | Default. |
| FMT | gersemi | CMake formatter | MPL-2.0 (K) | Y | PyPI:gersemi; GH:BlankSpruce/gersemi | **cmake-format** is dead (last release 2020). |
| LINT | clang-tidy | Lint, modernize, `cppcoreguidelines-*`, `cert-*`, `bugprone-*`, `readability-function-cognitive-complexity`, `readability-function-size` | Apache-2.0 with LLVM exception | P (`-fix`) | GH:llvm/llvm-project | Default. |
| LINT | Cppcheck | Undefined behavior, bugs; open-source MISRA C 2012 addon (partial, you supply rule texts, K) | GPL-3.0 | N | GH:cppcheck-opensource/cppcheck; https://cppcheck.sourceforge.io | Repository moved from `danmar/cppcheck`. |
| LINT | Cppcheck Premium | MISRA C 2012/2023/2025, MISRA C++ 2008/2023, CERT, AUTOSAR | Comm. | N | https://www.cppchecksolutions.com | S for coverage claims. |
| LINT | Clang Static Analyzer, GCC `-fanalyzer` | Path-sensitive analysis | Toolchain | N | Toolchain | |
| LINT | CodeChecker (Ericsson) | Runs clang-tidy, Clang SA, Cppcheck and others; web report server, suppression, diffs | Apache-2.0 | N | GH:Ericsson/codechecker; PyPI:codechecker | Good open-source hub for C/C++. |
| LINT | Infer | Null, leaks, races | MIT | N | GH:facebook/infer | |
| LINT | include-what-you-use | Header hygiene | NCSA-style (K) | P (`fix_includes.py`) | GH:include-what-you-use/include-what-you-use | |
| LINT | cpplint | Google C++ style | BSD-3-Clause (K) | N | PyPI:cpplint | slow: last release 2025-04. |
| LINT | Lizard | Complexity and length | MIT (K) | N | see 1.1 | |
| LINT (MISRA, commercial) | PC-lint Plus (Vector) | MISRA C 2012/2023/2025, MISRA C++ 2023, CERT C, AUTOSAR | Comm. | N | https://pclintplus.com | S |
| LINT (MISRA, commercial) | Perforce QAC (Helix QAC) | MISRA C/C++, AUTOSAR, CERT; certified for ISO 26262 and others | Comm. | N | vendor site | S: vendor claims full MISRA C 2025 coverage. |
| LINT (MISRA, commercial) | MathWorks Polyspace Bug Finder / Code Prover | MISRA, CERT, formal proof of absence of runtime errors | Comm. | N | vendor site | S: MISRA C 2025 support not confirmed in this research. |
| LINT (MISRA, commercial) | Parasoft C/C++test, LDRA, Black Duck Coverity, Perforce Klocwork, CodeSonar | MISRA, CERT, safety standards | Comm. | N | vendor sites | K |
| TYPE | Compiler warnings (`-Wall -Wextra -Werror`, `/W4 /WX`) | | Toolchain | N | Toolchain | |
| ARCH | Axivion Suite (Qt Group) | Architecture verification against a model, plus MISRA and clone detection | Comm. | N | vendor site | K. One of few tools with real architecture conformance for C/C++. |
| ARCH | Build-system boundaries (CMake target links, Bazel `visibility`) | Which libraries may depend on which | Toolchain | N | | The common open-source approach. |
| DUP | PMD CPD, jscpd | see 1.2 | | | | |
| SAST | Flawfinder | Risky C/C++ functions | GPL-2.0 | N | PyPI:flawfinder | slow (last commit 2026-05, no GitHub releases). |
| SAST | CodeQL, Semgrep, SonarQube Server (Comm.), Coverity, Klocwork | see 1.1 and above | | | | |
| SCA | OSV-Scanner and Trivy for Conan lockfiles (K for vcpkg) | | | | | Vendored C/C++ code is usually invisible to SCA; Black Duck snippet scanning (Comm.) is the main exception. |

### 2.15 Scala

| Layer | Tool | What it checks | License | Fix | Latest at | Notes |
|---|---|---|---|---|---|---|
| FMT | scalafmt | Formatting | Apache-2.0 | Y | GH:scalameta/scalafmt; Maven:org.scalameta:scalafmt-cli_2.13 | Default. |
| LINT | Scalafix | Lint and rewrite rules | BSD-3-Clause | Y | GH:scalacenter/scalafix | Default. |
| LINT | WartRemover | Flexible lint via compiler plugin | Apache-2.0 | N | Maven:org.wartremover:wartremover_* | GitHub releases stopped in 2020; Maven Central is current. |
| LINT | Scapegoat | Static analysis compiler plugin | Apache-2.0 | N | GH:scapegoat-scala/scapegoat | |
| TYPE | scalac with `-Werror`, `-Wunused` (Scala 3: `-Wunused:all`) | | Toolchain | N | Toolchain | |
| ARCH | ArchUnit | Works on Scala bytecode | Apache-2.0 | N | see 2.2 | K: Scala constructs map imperfectly. |
| DUP | PMD CPD (Scala), jscpd | see 1.2 | | | | |
| SAST | Semgrep (Scala, K), Find Security Bugs on bytecode (K) | | | | | SonarQube Community Build dropped Scala in 26.11. |
| SCA | OSV-Scanner, Trivy, Snyk via sbt dependency export (K) | | | | | Scala Steward keeps dependencies updated. |

### 2.16 Elixir

| Layer | Tool | What it checks | License | Fix | Latest at | Notes |
|---|---|---|---|---|---|---|
| FMT | `mix format` | Formatting | Apache-2.0 | Y | Toolchain | Default. |
| FMT | Styler | `mix format` plugin that also rewrites code to Credo-style rules | Apache-2.0 | Y | Hex:styler | Repository at `adobe/elixir-styler`. Quokka (Hex:quokka) is a fork with per-rule control. |
| LINT | Credo | Consistency, readability, `ABCSize`, `CyclomaticComplexity`, `FunctionArity`, `Nesting`, `DuplicatedCode` | MIT | N | Hex:credo | Default. |
| TYPE | Dialyzer via Dialyxir | Success typings | Apache-2.0 | N | Hex:dialyxir | |
| TYPE | Elixir compiler type checks | Gradual set-theoretic type checks built into recent Elixir versions | Apache-2.0 | N | Toolchain | K |
| ARCH | Boundary | Module boundaries and allowed dependencies, as a compiler step | MIT | N | Hex:boundary | |
| DUP | Credo `DuplicatedCode`, jscpd | | | | | |
| SAST | Sobelow | Phoenix security | Apache-2.0 | N | Hex:sobelow; GH:sobelow/sobelow | Moved from `nccgroup/sobelow` to `sobelow/sobelow`. |
| SCA | mix_audit | `mix.lock` against Elixir advisories | BSD-3-Clause | N | Hex:mix_audit | slow (last commit 2026-02). |
| SCA | `mix hex.audit`, OSV-Scanner (`mix.lock`) | Retired packages; vulnerabilities | | N | Toolchain; see 1.4 | |

### 2.17 Erlang

| Layer | Tool | What it checks | License | Fix | Latest at | Notes |
|---|---|---|---|---|---|---|
| FMT | erlfmt | Formatting | Apache-2.0 | Y | Hex:erlfmt | Default. **rebar3_format** is archived (2025-05). |
| LINT | Elvis | Style rules (line length, nesting, naming) | Apache-2.0 (K) | N | Hex:elvis_core | |
| LINT | rebar3_hank | Dead code | MIT | N | Hex:rebar3_hank; GH:AdRoll/rebar3_hank | |
| LINT | xref (OTP) | Undefined and deprecated calls; custom queries can forbid calls between applications | Apache-2.0 | N | Toolchain | Can serve as a coarse architecture check. |
| TYPE | Dialyzer | Success typings | Apache-2.0 | N | Toolchain (OTP) | Default. |
| TYPE | Gradualizer | Gradual type checker | MIT | N | GH:josefs/Gradualizer | slow (last commit 2026-03). |
| DUP | jscpd | see 1.2 | | | | |
| SCA | OSV-Scanner (`rebar.lock`, K) | | | | | |

**eqWAlizer** (WhatsApp's Erlang type checker) is archived (2026-06).

### 2.18 Haskell

| Layer | Tool | What it checks | License | Fix | Latest at | Notes |
|---|---|---|---|---|---|---|
| FMT | Ormolu | Opinionated formatter | BSD-3-Clause (K) | Y | Hackage:ormolu | |
| FMT | Fourmolu | Configurable fork of Ormolu | BSD-3-Clause (K) | Y | Hackage:fourmolu | |
| FMT | stylish-haskell | Imports, pragmas, alignment | BSD-3-Clause (K) | Y | Hackage:stylish-haskell | slow (last commit 2025-12). |
| LINT | HLint | Suggestions; `--refactor` applies them with apply-refact | BSD-3-Clause | P | Hackage:hlint | Default. |
| LINT | weeder | Dead code | BSD-3-Clause | N | Hackage:weeder; GH:ocharles/weeder | |
| LINT | stan | Static analysis (partial functions, anti-patterns) | MPL-2.0 | N | Hackage:stan | slow: last release 2023-10. |
| TYPE | GHC with `-Wall -Werror` | | Toolchain | N | Toolchain (GHCup) | |
| ARCH | Package and module export boundaries in Cabal | | | | | No dedicated tool (section 6). |
| SCA | Haskell Security Advisory Database (`haskell/security-advisories`, used by OSV, K) | | | | | Tool support for Cabal lockfiles is thin (K). |

### 2.19 OCaml

| Layer | Tool | What it checks | License | Fix | Latest at | Notes |
|---|---|---|---|---|---|---|
| FMT | ocamlformat | Formatting | MIT | Y | opam:ocamlformat | Default; `dune fmt`. |
| LINT | Compiler warnings via dune (`:standard` with errors in dev profile) | | Toolchain | N | Toolchain | |
| LINT | Zanuda | Linter for typical mistakes and style | LGPL-3.0 | N | opam:zanuda; GH:Kakadu/zanuda | |
| TYPE | OCaml compiler | | Toolchain | N | Toolchain | |
| ARCH | dune library dependencies and `(private_modules)` | | | | | No dedicated tool. |
| SCA | none mainstream (K) | | | | | Gap. |

### 2.20 Clojure

| Layer | Tool | What it checks | License | Fix | Latest at | Notes |
|---|---|---|---|---|---|---|
| FMT | cljfmt | Formatting | EPL-1.0 | Y | Clojars:dev.weavejester/cljfmt; GH:weavejester/cljfmt | Default. |
| FMT | zprint | Configurable pretty printer | MIT | Y | GH:kkinnear/zprint | slow (last commit 2025-05). |
| LINT | clj-kondo | Lint with arity and type inference, custom hooks | EPL-1.0 | N | GH:clj-kondo/clj-kondo | Default. |
| LINT | Splint | Idiom and style linter (successor in spirit of kibit) | MPL-2.0 | N | Clojars:io.github.noahtheduke/splint | |
| LINT | clojure-lsp | Diagnostics (from clj-kondo), `clean-ns`, format | MIT | Y | GH:clojure-lsp/clojure-lsp | |
| LINT | Eastwood, kibit | Older linters | EPL (K) | N | | slow: both last committed 2024. Prefer clj-kondo and Splint. |
| TYPE | Typed Clojure; runtime specs with spec or Malli | | (K) | N | | Optional; most projects rely on clj-kondo inference. |
| SCA | nvd-clojure | NVD scan of the classpath | MIT | N | GH:rm-hull/nvd-clojure | |
| SCA | OSV-Scanner, Trivy on `pom.xml` or exported deps (K) | | | | | |

### 2.21 R

| Layer | Tool | What it checks | License | Fix | Latest at | Notes |
|---|---|---|---|---|---|---|
| FMT | styler | tidyverse style | MIT (K) | Y | CRAN:styler | GitHub releases stopped 2024; CRAN is current (K). |
| FMT | Air (Posit) | Fast formatter written in Rust | MIT | Y | GH:posit-dev/air | Newer; integrated in Positron and RStudio (K). |
| LINT | lintr | Style and correctness, `cyclocomp_linter` | MIT (K) | N | CRAN:lintr | Default. |
| SCA | oysteR | Sonatype OSS Index scan of installed packages | Apache-2.0 | N | CRAN:oysteR | |
| SCA | OSV-Scanner (`renv.lock`, K) | | | | | |

### 2.22 Julia

| Layer | Tool | What it checks | License | Fix | Latest at | Notes |
|---|---|---|---|---|---|---|
| FMT | JuliaFormatter.jl | Formatting with style presets | MIT | Y | JuliaReg:JuliaFormatter; GH:domluna/JuliaFormatter.jl (now `JuliaEditorSupport`) | |
| FMT | Runic.jl | Opinionated formatter | MIT | Y | JuliaReg:Runic | |
| LINT | Aqua.jl | Package quality: method ambiguities, unbound type parameters, stale dependencies, piracy | MIT | N | JuliaReg:Aqua | |
| TYPE | JET.jl | Type-level analysis via abstract interpretation | MIT | N | JuliaReg:JET | |
| SCA | Julia security advisories (`JuliaLang/SecurityAdvisories.jl`, K) | | | | | Tooling is young (K). |

### 2.23 Lua

| Layer | Tool | What it checks | License | Fix | Latest at | Notes |
|---|---|---|---|---|---|---|
| FMT | StyLua | Formatter (Lua 5.1-5.4, LuaJIT, Luau) | MPL-2.0 | Y | GH:JohnnyMorganz/StyLua; crates:stylua | Default. |
| LINT | selene | Linter (Lua and Luau) | MPL-2.0 | N | GH:Kampfkarren/selene | |
| LINT | luacheck | Linter, cyclomatic complexity limit | MIT | N | LuaRocks:luacheck; GH:lunarmodules/luacheck | slow: last release 2024-05. |
| TYPE | lua-language-server `--check` | Type checking from LuaCATS annotations | MIT | N | GH:LuaLS/lua-language-server | |
| TYPE | Luau (Roblox) | Typed Lua dialect with its own analyzer | MIT (K) | N | GH:luau-lang/luau (K) | Only for Luau code. |

### 2.24 Perl

| Layer | Tool | What it checks | License | Fix | Latest at | Notes |
|---|---|---|---|---|---|---|
| FMT | Perl::Tidy (perltidy) | Formatting | GPL-2.0 | Y | CPAN:Perl-Tidy | Default. |
| LINT | Perl::Critic (perlcritic) | Perl Best Practices policies incl. `ProhibitExcessComplexity` | Artistic/GPL (Perl terms) | N | CPAN:Perl-Critic | Default. |
| SCA | CPAN::Audit | Installed modules against CPAN advisories | Perl terms (K) | N | CPAN:CPAN-Audit | K |

### 2.25 Delphi and Object Pascal

| Layer | Tool | What it checks | License | Fix | Latest at | Notes |
|---|---|---|---|---|---|---|
| FMT | RAD Studio formatter | Built-in IDE formatter (Ctrl+D) with shareable profiles | Comm. (part of RAD Studio) | Y | Embarcadero | K. No standalone open-source Delphi formatter was confirmed (CnPack CnWizards includes one, K). |
| LINT+DUP | SonarDelphi | SonarQube plugin, 100+ rules, metrics | LGPL-3.0 | N | GH:integrated-application-development/sonar-delphi | Active. Runs inside SonarQube Community Build. |
| LINT | DelphiLint | IDE package running SonarDelphi rules on the fly | LGPL-3.0 | N | GH:integrated-application-development/delphilint | Last release 2025-01. |
| LINT | Pascal Analyzer (Peganza) | Metrics, complexity, warnings, standalone CLI; free Lite edition | Comm. | N | https://www.peganza.com | S |
| LINT | TMS FixInsight | Bug patterns and conventions in the IDE and on build servers | Comm. | N | https://www.tmssoftware.com/site/fixinsight.asp | S: no recent release information found; check before proposing. |
| TYPE | Delphi compiler hints and warnings as errors | | Toolchain | N | Toolchain | |
| SAST | DerScanner and other commercial SAST (K) | | Comm. | N | vendor sites | K |

### 2.26 COBOL

| Layer | Tool | What it checks | License | Fix | Latest at | Notes |
|---|---|---|---|---|---|---|
| LINT | SonarQube Server Enterprise (COBOL, JCL, PL/I) | Rules for bugs, smells, security; dialects, embedded SQL and CICS | Comm. | N | https://www.sonarsource.com | V (Sonar docs). |
| LINT | COBOL Language Support (Eclipse Che4z) | Syntax and semantic diagnostics in VS Code | EPL-2.0 (K) | N | GH:eclipse-che4z/che-che4z-lsp-for-cobol; VS Code Marketplace | Active. Editor diagnostics, not a CI gate. |
| LINT | GnuCOBOL compiler warnings (`-fsyntax-only -Wall`) | | GPL-3.0 (K) | N | https://gnucobol.sourceforge.io (K) | |
| LINT | Rocket COBOL Analyzer (formerly Micro Focus Enterprise Analyzer), IBM Application Discovery / Developer for z/OS code review | Impact analysis and rules | Comm. | N | vendor sites | S |

### 2.27 Fortran

| Layer | Tool | What it checks | License | Fix | Latest at | Notes |
|---|---|---|---|---|---|---|
| FMT | fprettify | Free-form Fortran formatter | GPL-3.0 (K) | Y | PyPI:fprettify; GH:fortran-lang/fprettify | slow: last release 2020, repository active again under fortran-lang. |
| FMT | findent | Indentation and fixed-to-free conversion | BSD (K) | Y | PyPI:findent (K) | K |
| LINT | Fortitude | Fast linter written in Rust, many rules | MIT | P (`--fix`) | PyPI:fortitude-lint; GH:PlasmaFAIR/fortitude | Active. |
| LINT | fortls | Language server diagnostics | MIT | N | PyPI:fortls | |
| LINT | CamFort | Units-of-measure checking, refactoring | Apache-2.0 (K) | P | GH:camfort/camfort | slow: last release 2022. |
| TYPE | Compiler checks (`gfortran -Wall -Wextra -fimplicit-none -Werror`) | | Toolchain | N | Toolchain | |

### 2.28 Ada

| Layer | Tool | What it checks | License | Fix | Latest at | Notes |
|---|---|---|---|---|---|---|
| FMT | GNATformat | Opinionated formatter (based on a Prettier engine port) | (K) | Y | GH:AdaCore/gnatformat; Alire:gnatformat (K) | V (AdaCore docs). gnatpp is the older formatter. |
| LINT | GNAT style checks (`-gnaty`), warnings (`-gnatwa -gnatwe`) | | GPL-3.0 with runtime exception | N | Toolchain (GNAT via Alire) | |
| LINT | GNATcheck | Coding standards, restrictions, metrics (cyclomatic complexity, SLOC) | Comm. (part of GNAT SAS, K) | N | https://www.adacore.com/static-analysis/gnatcheck | V |
| LINT | AdaControl | Rule checker | GPL (K) | N | (K) | K |
| SAST | GNAT SAS (formerly CodePeer) | Deep static analysis | Comm. | N | https://www.adacore.com | V |
| TYPE | SPARK / GNATprove | Formal proof of absence of runtime errors and of contracts | GPL-3.0 (community via Alire); Pro Comm. | N | GH:AdaCore/spark2014; Alire:gnatprove | |

### 2.29 Zig

| Layer | Tool | What it checks | License | Fix | Latest at | Notes |
|---|---|---|---|---|---|---|
| FMT | `zig fmt` | Formatting | MIT | Y | Toolchain: https://ziglang.org/download/ | Zig moved development from GitHub to Codeberg (`codeberg.org/ziglang/zig`); the GitHub repository stopped receiving commits in 2025-11. |
| LINT | `zig ast-check`, compiler | Syntax and semantic errors | MIT | N | Toolchain | |
| LINT | ZLint | Linter with semantic analysis | MIT | P | GH:DonIsaac/zlint | Active. |

### 2.30 Nim

| Layer | Tool | What it checks | License | Fix | Latest at | Notes |
|---|---|---|---|---|---|---|
| FMT | nph | Opinionated formatter | MIT (K) | Y | Nimble:nph; GH:arnetheduck/nph | slow (last commit 2026-02). |
| FMT | nimpretty | Formatter bundled with Nim | MIT | Y | Toolchain | |
| LINT+TYPE | `nim check`, compiler hints and warnings (`--hintAsError`, `--warningAsError`) | | MIT | N | Toolchain: https://nim-lang.org/install.html | |

### 2.31 Crystal

| Layer | Tool | What it checks | License | Fix | Latest at | Notes |
|---|---|---|---|---|---|---|
| FMT | `crystal tool format` | Formatting | Apache-2.0 | Y | Toolchain | |
| LINT | Ameba | Style, lint, `CyclomaticComplexity` | MIT | P (`--fix`) | GH:crystal-ameba/ameba | Default. |
| TYPE | Crystal compiler (global type inference) | | Apache-2.0 | N | Toolchain | |

### 2.32 SQL (PostgreSQL, T-SQL, PL/SQL and others)

| Layer | Tool | What it checks | License | Fix | Latest at | Notes |
|---|---|---|---|---|---|---|
| FMT+LINT | SQLFluff | Dialect-aware lint and format: ANSI, PostgreSQL, T-SQL, Oracle, MySQL, BigQuery, Snowflake, dbt/Jinja and more | MIT | Y (`sqlfluff fix`) | PyPI:sqlfluff | Default. PL/SQL procedural code is only partly supported (K). |
| FMT+LINT | sqruff | Rust reimplementation with SQLFluff-like rules, faster | Apache-2.0 | Y | crates:sqruff; GH:quarylabs/sqruff | |
| FMT | sqlfmt | Opinionated formatter for dbt-style SQL | Apache-2.0 (K) | Y | PyPI:shandy-sqlfmt | |
| FMT | pgFormatter | PostgreSQL formatter | PostgreSQL | Y | GH:darold/pgFormatter | |
| LINT | Squawk | PostgreSQL migration safety (locking, downtime risks) | Apache-2.0 | N | GH:sbdchd/squawk; npm:squawk-cli | |
| LINT | plpgsql_check | Static checks for PL/pgSQL functions (inside PostgreSQL) | MIT-style (K) | N | GH:okbob/plpgsql_check | |
| LINT | TSQLLint | T-SQL rules | MIT | N | GH:tsqllint/tsqllint; npm:tsqllint | slow: last release 2024-09. |
| LINT | SQL Server code analysis (SSDT / `Microsoft.Build.Sql` SDK projects) | T-SQL design, naming and performance rules at build | MIT / Free (prop.) (K) | N | NuGet:Microsoft.Build.Sql (K) | K |
| LINT | dbLinter | PL/SQL and SQL rules (successor of db* CODECOP, same author) | Freemium (prop.) | N | GH:Grisselbav (K) | S. **db\* CODECOP** (Trivadis) is archived and marked unmaintained. |
| LINT | Oracle SQLcl `codescan` and `format` | Trivadis guideline checks and formatting | Free (prop.) | Y (format) | https://www.oracle.com/database/sqldeveloper/technologies/sqlcl/ | S |
| LINT | SonarQube Server Developer (PL/SQL, T-SQL) | | Comm. | N | see 1.1 | |

### 2.33 Shell (bash, sh)

| Layer | Tool | What it checks | License | Fix | Latest at | Notes |
|---|---|---|---|---|---|---|
| FMT | shfmt | Formatter for POSIX sh, bash, mksh | BSD-3-Clause | Y | GH:mvdan/sh; Go:mvdan.cc/sh/v3/cmd/shfmt | Default. |
| LINT | ShellCheck | Bugs and pitfalls | GPL-3.0 | P (`-f diff`) | GH:koalaman/shellcheck | Default. Last release 2025-08. |
| LINT | shellharden | Rewrites to safe quoting | MPL-2.0 | Y | crates:shellharden | |
| LINT | bashate | OpenStack style for bash | Apache-2.0 | N | PyPI:bashate | slow. |

### 2.34 PowerShell

| Layer | Tool | What it checks | License | Fix | Latest at | Notes |
|---|---|---|---|---|---|---|
| FMT | PSScriptAnalyzer `Invoke-Formatter` | Formatting | MIT | Y | PSGallery:PSScriptAnalyzer | |
| LINT | PSScriptAnalyzer `Invoke-ScriptAnalyzer` | Best-practice and security rules, custom rules | MIT | P (`-Fix`) | PSGallery:PSScriptAnalyzer | Default; the only mainstream option. |
| TYPE | none | | | | | Gap (section 6). |

### 2.35 Solidity

| Layer | Tool | What it checks | License | Fix | Latest at | Notes |
|---|---|---|---|---|---|---|
| FMT | `forge fmt` (Foundry) | Formatting | MIT/Apache-2.0 | Y | GH:foundry-rs/foundry | Default with Foundry. |
| FMT | prettier-plugin-solidity | Prettier for Solidity | MIT | Y | npm:prettier-plugin-solidity | Default with Hardhat. |
| LINT | Solhint | Style, security and best practices, `code-complexity`, `function-max-lines` | MIT | P | npm:solhint | |
| TYPE | solc | Compiler | GPL-3.0 (K) | N | GH:ethereum/solidity (K) | |
| SAST | Slither | Detectors for vulnerabilities, printers, upgradeability checks | AGPL-3.0 | N | PyPI:slither-analyzer | Default. |
| SAST | Wake (Ackee) | Static analysis plus testing framework | ISC | N | PyPI:eth-wake | |
| SAST | Mythril | Symbolic execution | MIT | N | PyPI:mythril | slow: last release 2024-03. |
| SAST | Aderyn (Cyfrin) | | GPL-3.0 | | | **Dead**: repository archived, described as "Retired and no longer maintained". |

### 2.36 VHDL, Verilog and SystemVerilog

| Layer | Tool | What it checks | License | Fix | Latest at | Notes |
|---|---|---|---|---|---|---|
| FMT+LINT | Verible | SystemVerilog formatter, style linter, language server | Apache-2.0 (K) | Y (format), P (lint) | GH:chipsalliance/verible | Default for SystemVerilog. |
| LINT | svlint | Configurable SystemVerilog rules | MIT | N | GH:dalance/svlint; crates:svlint | slow (last commit 2025-11). |
| LINT | slang | Full SystemVerilog compiler front end; strict elaboration diagnostics | MIT | N | GH:MikePopoloski/slang | |
| LINT | Verilator `--lint-only` | Synthesizable Verilog/SV lint | LGPL-3.0 / Artistic-2.0 | N | GH:verilator/verilator (tags) | |
| FMT+LINT | VSG (VHDL Style Guide) | VHDL formatter and rule checker | GPL-3.0 | Y | PyPI:vsg | Default for VHDL. |
| LINT | VHDL-LS (rust_hdl) | VHDL language server with semantic checks | MPL-2.0 (K) | N | GH:VHDL-LS/rust_hdl | |
| LINT | GHDL (`ghdl -s`) | VHDL analysis | GPL-2.0 | N | GH:ghdl/ghdl | |
| LINT | Synopsys SpyGlass, Siemens Questa Lint, Cadence HAL | Commercial RTL lint and CDC | Comm. | N | vendor sites | K |

### 2.37 Markdown, YAML and other text files

| Layer | Tool | What it checks | License | Fix | Latest at | Notes |
|---|---|---|---|---|---|---|
| FMT | Prettier | Markdown, YAML, JSON | MIT | Y | npm:prettier | |
| LINT | markdownlint-cli2 | Markdown rules (markdownlint library) | MIT | Y (`--fix`) | npm:markdownlint-cli2 | Default. |
| LINT | markdownlint-cli | Older CLI for the same library | MIT | Y | npm:markdownlint-cli | |
| LINT | rumdl | Rust Markdown linter compatible with markdownlint rules | MIT (K) | Y | PyPI:rumdl; crates:rumdl (K) | Newer. |
| LINT | remark-lint | Markdown lint via the remark ecosystem | MIT | Y | npm:remark-lint | |
| LINT | Vale | Prose style (Microsoft, Google styles, custom vocabularies) | MIT | N | GH:errata-ai/vale (now `vale-cli/vale`) | |
| FMT | yamlfmt (Google) | YAML formatter | Apache-2.0 | Y | GH:google/yamlfmt | |
| LINT | yamllint | YAML syntax and style | GPL-3.0 | N | PyPI:yamllint | Default. |
| LINT | Spectral | OpenAPI, AsyncAPI and custom JSON/YAML rulesets | Apache-2.0 | N | npm:@stoplight/spectral-cli | |

## 3. Container and infrastructure-as-code scanning

| Target | Tool | What it checks | License | Fix | Latest at | CI integration | Notes |
|---|---|---|---|---|---|---|---|
| Dockerfile | hadolint | Dockerfile best practices; runs ShellCheck on `RUN` | GPL-3.0 | N | GH:hadolint/hadolint | GitHub Action, GitLab, any CI (Docker image) | Default. |
| Dockerfile | Docker build checks (`docker build --check`) | BuildKit's built-in Dockerfile rules | Apache-2.0 | N | Toolchain (Docker / BuildKit) | Any CI with Docker | K |
| Image | Trivy, Grype | OS and language package vulnerabilities in images | Apache-2.0 | N | see 1.4 | see 1.4 | |
| Image | Dockle | Image best practices and CIS benchmark | Apache-2.0 | N | GH:goodwithtech/dockle | GitHub Action, any CI | slow: last release 2025-01. |
| Image | Docker Scout | Image CVEs and policy | Freemium | N | GH:docker/scout-cli | GitHub Action, any CI | |
| Terraform | `terraform fmt`, `terraform validate` (or `tofu fmt`, `tofu validate`) | Formatting and validation | BUSL-1.1 (Terraform) / MPL-2.0 (OpenTofu) (K) | Y (fmt) | Toolchain | Any CI | |
| Terraform | TFLint | Provider-aware lint (AWS, Azure, GCP rulesets) | MPL-2.0 | P (`--fix`) | GH:terraform-linters/tflint | GitHub Action, any CI | Default lint. |
| Terraform, CloudFormation, K8s, Helm, Dockerfile, ARM/Bicep | Trivy (misconfiguration) | Security misconfigurations | Apache-2.0 | N | see 1.4 | see 1.4 | Absorbed tfsec's checks. |
| Same, plus Serverless, Kustomize, GitHub Actions, Ansible | Checkov | 1,000+ policies, graph checks across resources; also SCA and secrets | Apache-2.0 | P (some fixes in the commercial platform) | GH:bridgecrewio/checkov; PyPI:checkov | GitHub Actions (`checkov-action`), GitLab, Jenkins, Azure Pipelines, Bitbucket, CircleCI | Default security scan for IaC. |
| Same, plus OpenAPI, Pulumi, Crossplane | KICS | Query-based IaC security | Apache-2.0 | P (remediation for some queries, K) | GH:Checkmarx/kics | GitHub Action, GitLab, Azure, Jenkins, any CI | |
| Any structured config | conftest (OPA/Rego) | Custom policies | Apache-2.0 | N | GH:open-policy-agent/conftest | Any CI | For organization-specific rules. |
| Terraform | tfsec | | MIT | | | | **Superseded**: Aqua moved its checks into Trivy and directs users there; last release 2025-05. |
| Terraform, K8s | Terrascan (Tenable) | | Apache-2.0 | | | | **Dead**: repository archived 2025-11. |
| CloudFormation | cfn-lint | Template validity and best practices | MIT-0 | N | PyPI:cfn-lint | Any CI | |
| CloudFormation | CloudFormation Guard | Policy-as-code rules | Apache-2.0 | N | GH:aws-cloudformation/cloudformation-guard | Any CI | **cfn_nag** is slow (last commit 2024-08). |
| Kubernetes YAML | kubeconform | Schema validation incl. CRDs | Apache-2.0 | N | GH:yannh/kubeconform | Any CI | Default schema check. **kubeval** is unmaintained (its README points to kubeconform). |
| Kubernetes YAML | KubeLinter | Security and production-readiness checks | Apache-2.0 | N | GH:stackrox/kube-linter | GitHub Action, any CI | |
| Kubernetes YAML | Kubescape | NSA/CISA, MITRE and CIS frameworks; also live clusters | Apache-2.0 | P (`kubescape fix`, K) | GH:kubescape/kubescape | GitHub Action, GitLab, any CI | CNCF project. |
| Kubernetes YAML | Polaris | Best-practice checks; also admission controller | Apache-2.0 | P (`polaris fix`, K) | GH:FairwindsOps/polaris | Any CI | |
| Kubernetes YAML | kube-score | Object analysis with recommendations | MIT | N | GH:zegl/kube-score | Any CI | slow: last release 2025-04. |
| Kubernetes YAML | Datree | | Apache-2.0 | | | | **Dead**: archived 2024. |
| Helm | `helm lint`, chart-testing (`ct lint`) | Chart structure, version bumps, rendering | Apache-2.0 | N | Toolchain (Helm); GH:helm/chart-testing | GitHub Action (`helm/chart-testing-action`), any CI | Render with `helm template` and feed kubeconform, KubeLinter or Checkov. |
| Helm | helm-unittest | Unit tests for rendered templates | MIT | N | GH:helm-unittest/helm-unittest | Any CI | |
| GitHub Actions workflows | actionlint | Workflow syntax, expressions, ShellCheck on `run:` | MIT | N | GH:rhysd/actionlint | Any CI | |
| GitHub Actions workflows | zizmor | Workflow security (injection, unpinned actions, excessive permissions) | MIT | P (`--fix`, K) | GH:zizmorcore/zizmor; PyPI:zizmor | Any CI | Relevant given the 2026 trivy-action incident. |

## 4. Secret scanning

| Tool | What it checks | License | Fix | Latest at | CI integration | Notes |
|---|---|---|---|---|---|---|
| gitleaks | Regex and entropy rules over files and git history | MIT | N | GH:gitleaks/gitleaks | GitHub Action (`gitleaks-action`, free license key required for organization accounts, K), GitLab, any CI; pre-commit hook | Widely used. Last release 2026-03. |
| Betterleaks | Drop-in gitleaks successor by gitleaks' original author (March 2026); CEL-based validation | MIT | N | GH:betterleaks/betterleaks | Any CI; pre-commit (K) | V for repository activity; S for the rest. Sponsored by Aikido. |
| TruffleHog | 800+ detectors, verifies whether found credentials are live; git, S3, Docker, etc. | AGPL-3.0 | N | GH:trufflesecurity/trufflehog | GitHub Action, GitLab, CircleCI, Jenkins, any CI (K for the list); pre-commit hook | Verification reduces false positives. |
| Kingfisher (MongoDB) | Secret detection with live validation | Apache-2.0 | N | GH:mongodb/kingfisher | Any CI | |
| detect-secrets (Yelp) | Baseline-file approach for gradual adoption | Apache-2.0 | N | PyPI:detect-secrets | pre-commit, any CI | slow: last release 2024-05. |
| ggshield (GitGuardian) | GitGuardian detectors | MIT CLI; Freemium service | N | PyPI:ggshield | All major CI; pre-commit | Needs a GitGuardian account. |
| GitHub secret scanning and push protection | Provider patterns, blocks pushes | Free on public repositories; GitHub Secret Protection (Comm.) for private | N | https://docs.github.com/code-security/secret-scanning | GitHub only | |
| GitLab secret detection | Built into GitLab CI templates (gitleaks-based, K) | Free tier + Ultimate features | N | GitLab docs | GitLab only | K |
| Trivy, Checkov, Semgrep | Secret scanning as a side feature | see above | | | | |

## 5. Commit message linting and git hook managers

### 5.1 Commit message linting

| Tool | What it checks | License | Fix | Latest at | CI integration | Notes |
|---|---|---|---|---|---|---|
| commitlint | Conventional Commits (or custom) rules | MIT | N | npm:@commitlint/cli | Any CI with `commitlint --from --to`; docs cover GitHub Actions, GitLab CI, CircleCI, Travis (K); third-party `wagoid/commitlint-github-action` | Default for JS repositories; works in any repository with Node available. |
| Commitizen (Python) | `cz check` validation, guided commits, version bump and changelog | MIT | n/a | PyPI:commitizen | Any CI; pre-commit hook | Default for Python repositories. |
| cz-cli (JS Commitizen) | Guided commit prompt, not a validator | MIT | n/a | npm:commitizen | | Pair with commitlint. |
| cocogitto | `cog check`, bump, changelog | MIT | n/a | crates:cocogitto; GH:cocogitto/cocogitto | GitHub Action (`cocogitto-action`, K), any CI | Single binary, no Node. |
| convco | Conventional Commits check, changelog, version | MIT | n/a | crates:convco | Any CI | |
| committed (crate-ci) | Commit message style checks | MIT/Apache-2.0 | N | crates:committed | GitHub Action, any CI | |
| Conform (Sidero Labs) | Commit policies (Conventional Commits, sign-off, GPG) | MPL-2.0 | N | GH:siderolabs/conform | Any CI | |
| gitlint | Python commit message linter | MIT | N | PyPI:gitlint | | slow: last release 2023-03, last commit 2024-07. Prefer Commitizen or commitlint. |

### 5.2 Git hook managers

| Tool | What it does | License | Latest at | Notes |
|---|---|---|---|---|
| pre-commit | Multi-language hook framework with a large hook registry; isolated environments per hook | MIT | PyPI:pre-commit | Default for polyglot and Python repositories. CI: `pre-commit run --all-files` anywhere; pre-commit.ci hosted service for GitHub (free for open source). |
| prek | Rust reimplementation of pre-commit using the same config, faster | MIT | GH:j178/prek; PyPI:prek | Newer; check compatibility with the hooks used. |
| lefthook | Fast Go binary, parallel hooks, any language | MIT | GH:evilmartians/lefthook; npm:lefthook; gem:lefthook; PyPI:lefthook | Good when Node and Python are both absent or the user wants one binary. |
| husky | Git hooks for npm projects | MIT | npm:husky | Default for JS repositories. Last GitHub release 2024-11; mature and small. |
| simple-git-hooks | Minimal alternative to husky | MIT | npm:simple-git-hooks | |
| lint-staged | Runs commands on staged files only (used with husky or lefthook) | MIT | npm:lint-staged | Not a hook manager by itself. |
| Overcommit | Ruby hook manager | MIT | gem:overcommit | |
| CaptainHook, GrumPHP | PHP hook managers | MIT | see 2.9 | |
| Husky.Net | .NET hook manager | MIT | NuGet:Husky | |
| cargo-husky, rusty-hook | Rust | MIT | | cargo-husky slow, rusty-hook dead (2.8). |
| Git `core.hooksPath` | Plain scripts in a versioned folder | Toolchain | Toolchain | Zero dependencies; no per-language tooling. |

Hooks run on the developer's machine and can be skipped (`--no-verify`). Every check a hook runs must also run in CI.

## 6. Gaps and weak areas

| Stack | Layer | Situation |
|---|---|---|
| Rust, Haskell, OCaml, Elixir (beyond Boundary), Erlang, Zig, Nim, Crystal, Lua, Perl, R, Julia | ARCH | No ArchUnit-like tool. Use crate, package or library boundaries in the build system, or Semgrep custom rules that forbid imports across layers. |
| C, C++ | ARCH | Open source: build-system visibility only. Commercial: Axivion. |
| Dart/Flutter, Swift | ARCH | Only small or commercial options (DCM, Harmonize). |
| Delphi, COBOL | ARCH, DUP, SCA | Mostly commercial; SonarDelphi covers lint and duplication for Delphi. No open-source COBOL formatter or linter suitable for CI was confirmed. |
| PowerShell, shell, Lua (without annotations), Perl, R | TYPE | No static type checker. |
| OCaml, Crystal, Zig, Nim, Lua, Perl, Julia, Fortran, Ada, Delphi, COBOL, Solidity | SCA | No mature vulnerability scanner; ecosystems have few advisories. |
| C, C++ | SCA | Only lockfile-based managers (Conan) are covered; vendored code needs commercial snippet scanning. |
| Ada, COBOL, Delphi, MISRA C/C++ | LINT, SAST | The strong tools are commercial. |
| Erlang, Haskell, Clojure | SAST | No dedicated security analyzer; Semgrep custom rules only. |
| Fortran | FMT | fprettify has not released since 2020. |

## 7. Dead, retired or moved tools (as of 2026-11-17)

| Tool | Status | Use instead |
|---|---|---|
| TSLint | Archived 2021 | typescript-eslint |
| Rome | Archived 2023 | Biome |
| JSCS | Archived | ESLint |
| nsp | Archived 2018 | `npm audit`, OSV-Scanner |
| pytype (Google) | Archived; last supported Python 3.12 | mypy, Pyright, Pyrefly, ty |
| Pyre (Meta) | Archived, retired | Pyrefly |
| Security Code Scan (.NET) | No release since 2022 | .NET security analyzers, CodeQL, Semgrep |
| NetArchTest.Rules (original) | No release since 2021 | NetArchTest.eNhancedEdition, ArchUnitNET |
| dotnet/roslyn-analyzers repository | Archived; analyzers ship with the .NET SDK | Built-in .NET analyzers |
| Horusec | No release since 2022 | Semgrep, Opengrep, CodeQL |
| phpcpd | Archived 2023 | jscpd, PMD CPD |
| local-php-security-checker | Archived 2024 | `composer audit` |
| squizlabs/PHP_CodeSniffer | Abandoned 2023 | PHPCSStandards/PHP_CodeSniffer (same Packagist name, K) |
| qossmic/deptrac | Archived (moved) | deptrac/deptrac |
| jeremylong/DependencyCheck | Archived (moved) | dependency-check/DependencyCheck |
| dart_code_metrics (open source) | Discontinued | DCM (commercial) or built-in analyzer |
| custom_lint (Dart) | Archived 2026-03 | Analyzer rules, DCM |
| dart-lang/linter | Archived; merged into the Dart SDK | `dart analyze` |
| Periphery (Swift) open source | Archived 2026-08; now commercial | Periphery (commercial) or SwiftLint `unused_declaration` (K) |
| rebar3_format | Archived 2025-05 | erlfmt |
| eqWAlizer | Archived 2026-06 | Dialyzer |
| cmake-format | No release since 2020 | gersemi |
| rusty-hook | Last commit 2023 | pre-commit, prek, lefthook |
| db\* CODECOP (Trivadis PL/SQL Cop) | Archived, marked unmaintained | dbLinter (proprietary), SQLcl `codescan`, SonarQube |
| Aderyn (Solidity) | Archived, "Retired and no longer maintained" | Slither, Wake, Solhint |
| Terrascan | Archived 2025-11 | Checkov, Trivy, KICS |
| tfsec | Superseded by Trivy | Trivy |
| Datree | Archived 2024 | KubeLinter, Kubescape, Checkov |
| kubeval | Unmaintained | kubeconform |
| Sourcetrail (code explorer, sometimes listed for architecture) | Archived 2021 (K) | dependency graphs from the tools above |

## 8. Finding tools for a stack not listed

An agent follows these steps when the project uses a language, framework or file type this file does not cover, or when a listed tool turns out to be dead.

### 8.1 Search, in this order

1. **Official language and framework docs.** Look for pages named "tooling", "style guide", "linting", "formatting", "static analysis" or "security". Many languages bundle a formatter and linter in the toolchain (`go fmt`, `cargo fmt`, `dart format`, `zig fmt`, `crystal tool format`, `mix format`). A bundled or officially recommended tool beats any third-party one.
2. **The framework's project generator.** Run or read the official generator (for example `ng new`, `create-vite`, `dotnet new`, `mix phx.new`) and see which linters and formatters it configures. That is the community default.
3. **The ecosystem's package registry.** Search the registry (npm, PyPI, crates.io, Maven Central, NuGet, Packagist, RubyGems, Hex, Hackage, opam, Clojars, CRAN, Julia General, LuaRocks, CPAN, pub.dev, pkg.go.dev, Swift Package Index, Alire, Nimble, PowerShell Gallery) for the language name plus "lint", "format", "fmt", "style", "analyzer", "audit", "license", "arch". Sort by downloads where the registry allows it.
4. **Multi-language tool support lists.** Check the supported-language pages of MegaLinter, Super-Linter, Trunk, Semgrep, CodeQL, SonarQube, PMD CPD, jscpd, Lizard, OSV-Scanner (supported lockfiles) and Trivy. A language appearing there usually comes with the community's preferred linter named.
5. **Awesome lists.** `analysis-tools-dev/static-analysis` (https://github.com/analysis-tools-dev/static-analysis, also https://analysis-tools.dev) is the broadest list of linters and analyzers by language. Then `awesome-<language>` lists (search GitHub for `awesome-<language>`), which usually have a "Code analysis" or "Linters" section.
6. **GitHub topics.** Browse `https://github.com/topics/<language>-linter`, `<language>-formatter`, `static-analysis`, `linter` filtered by language, sorted by recently updated and by stars.
7. **Editor integrations.** VS Code Marketplace and Open VSX extensions for the language often wrap the standard linter and formatter; the extension's README names them.
8. **Security databases.** For SCA, check whether OSV (https://osv.dev, list of ecosystems) or the GitHub Advisory Database covers the ecosystem. If not, no SCA tool can do much; say so.
9. **Community forums.** The language's official forum, Discourse or subreddit: search "linter" or "formatter" and read recent threads to confirm what people actually use. Treat this as confirmation, not as the source.

### 8.2 Judge whether a tool is alive

Check each candidate before proposing it. For a GitHub-hosted tool, one call returns most of this:

```bash
gh api repos/OWNER/REPO --jq '{archived, pushed_at, license: .license.spdx_id, open_issues: .open_issues_count, description}'
gh api repos/OWNER/REPO/releases/latest --jq '{tag_name, published_at}'
```

| Signal | Alive | Warning | Dead |
|---|---|---|---|
| Repository flag | Not archived | | Archived, or README says "unmaintained", "deprecated", "moved", "retired" |
| Last commit on the default branch | Within 6 months | 6-18 months | Over 18 months with open bug reports |
| Last release (GitHub releases, or the registry if the project only publishes there) | Within 12 months | 12-24 months | Over 24 months |
| Supports the current language or runtime version | Yes, stated in changelog or CI matrix | Unclear | Fails on the current version, open issue unanswered |
| Issues and pull requests | Maintainers respond within weeks; PRs get merged | Many unanswered issues; only bots commit | Issues disabled or ignored for a year |
| Maintainers | Two or more, or backed by an organization or foundation | Single maintainer | Maintainer has announced leaving with no successor |
| Registry downloads trend | Stable or growing | Falling | Near zero |
| Successor | | A fork or rewrite is gaining users | Project points to a successor |

Further rules:

- **Follow redirects.** GitHub silently redirects moved repositories. When `full_name` in the API answer differs from what was asked, the project moved; use the new name. Several tools in this file moved in 2024-2026.
- **Mature is not dead.** Small, finished tools (for example husky, Flay) may release rarely. Look at whether issues are answered and whether they work on the current runtime, not only at dates.
- **Releases may live elsewhere.** Some projects publish only to their registry (RubyGems, Maven Central, CRAN, Hex) and never create GitHub releases. Check the registry before calling a project stale.
- **Check the license again.** Projects change licenses (Semgrep rules, Periphery, HashiCorp Terraform). Read the current LICENSE file and the latest release notes.
- **Check supply-chain safety.** For CI actions and installers, prefer official ones, pin by commit SHA, and look for recent security advisories on the repository (GitHub "Security" tab).
- **Mark what was not verified.** When the agent proposes a tool it could not check, it tells the user so in plain words.

### 8.3 Propose to the user

For each layer, give the user: the recommended tool and why (standard in the community, bundled, or covers several layers), one or two alternatives with the trade-off in one sentence, license and cost, whether it auto-fixes, and whether it is alive by the checks above. If no tool is good enough, say the layer has a gap and suggest the closest substitute (for example Semgrep custom rules for architecture rules, jscpd for duplication, editorconfig-checker as a formatter of last resort, Lizard for complexity).
