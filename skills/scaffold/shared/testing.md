# Testing

Tests are grouped by what they check. What a test needs (a database, a browser, an emulator, a virtual machine, a container, a real device) is its environment, set by the platform, not a kind of its own. Check each behavior at the lowest level that can catch it. This file names no tool: each stack's `stack.md` says how every kind is done on that stack ("Tests by kind").

## Kinds

| Kind | What it checks | How | Environment |
|---|---|---|---|
| Static checks (not tests) | What the source alone shows: format, lint, architecture rules, types, build, duplication, commit messages | Tools read the source | Local, nothing external |
| Unit | One piece of logic: a function, class, module, formula or rule. Every validation rule, boundary, decision table row, state transition and calculation in the design | Call it directly; replace storage, network, clock, randomness, system calls and hardware with fakes | In the test process |
| Component (with a UI) | One UI part, screen or scene in each of its states, without the backend | Render it alone, set a state, act as the user, check the result | A simulated or headless renderer |
| Integration | Your code against one real thing outside the process: storage, file formats, system interfaces, another service, messaging, hardware, a host application or engine. No UI | Start the real dependency and call your adapter. Third parties you cannot control or that charge: their sandbox or a recorded replay | A throwaway environment per run (container, temp directory, emulator, VM snapshot) at production versions; ports and paths configurable |
| End-to-end | Key user flows through the real entry point (UI, command line, public API, game input, or the delivered file opened in its target application), with the whole product running | Build the real artifact, put it in a clean environment, drive it as a user, check what the user sees | A clean throwaway environment; each test has its own accounts and data |
| Snapshot (visual regression is one) | Whether output changed unexpectedly: screenshots, rendering, sound, generated files or reports, command output | Produce the output from fixed input; compare it with an approved baseline within a set tolerance | A pinned environment: image or OS version, fonts, resolution, locale, time zone; animation and randomness fixed |
| Delivery | Whether the product works where users get it: install, upgrade from the last release (old data, formats, migrations), uninstall, first run, permissions, signing; for services, deploy and roll back | Install fresh; install the last release, add data, upgrade, check the data | A clean VM, emulator or environment snapshot |
| Non-functional (when required) | Performance and load, resource use (memory, battery, frame rate), security scans, accessibility, compatibility, localization | Measure against targets the project sets | A fixed, production-like environment so results compare |

Why a test is written does not make a new kind: a bug reproduction (written first, failing, at the lowest level that reproduces it), a characterization test (pins current behavior before refactoring), an acceptance test (an issue's criteria, usually end-to-end or integration).

Static checks, unit and component tests are light; the rest are heavy. Weight is a property: an integration test that only uses a temp directory and runs in seconds is light.

## Choosing kinds

The project answers these and uses each kind answered yes; every project has static checks.

1. Own logic (calculations, rules, validation, state)? Unit.
2. A UI (pages, windows, screens, scenes, forms)? Component.
3. Code that touches anything outside the process? Integration.
4. Results that take users several steps across several parts? End-to-end, key flows only.
5. Output users look at or use that a few assertions cannot describe? Snapshot.
6. Installed, upgraded or deployed, or data kept across versions? Delivery.
7. Targets for performance, resources, security, accessibility or compatibility? Non-functional, for those targets only.

CLAUDE.md lists each kind used: command, environment, what runs at each stage, its CI job. Each kind not used gets one line saying why, so a review can tell a gap from a choice.

Examples that differ a lot (not a list to pick from):

| Project | Kinds | Left out because |
|---|---|---|
| A library of calculations | Unit; delivery (installs, imports, public interface stays compatible) | No UI, nothing outside the process, no user flow |
| A command line tool | Unit; integration (file system); end-to-end (run the process, check arguments, output, exit code); snapshot (output text); delivery | No UI |
| An application with a backend (web, mobile, desktop) | All seven; non-functional only for the targets in the requirements | |
| A game | Unit (rules, numbers); component (scenes); integration (saves, networking); end-to-end (scripted input plays a level); snapshot (frames with a fixed random seed); delivery; non-functional (frame rate, memory) | |
| A spreadsheet workbook | Unit (formula results on sample inputs); integration (macros or queries against external data); end-to-end (open in the target application, change inputs, read results); snapshot (report output); delivery (opens in the target versions) | Component, when it has no custom UI parts |

## Stages

| Kind | While coding | Before each commit | Before the PR | CI (each PR) | After merge | Before release |
|---|---|---|---|---|---|---|
| Static | Changed files | All | All | All | As CI | - |
| Unit | Related | All | All | All | As CI | - |
| Component | Related | All | All | All | As CI | - |
| Integration | Related, when fast | Related | All | All, own job | As CI | - |
| End-to-end | - | Affected flows, main environment | All, main environment | All, representative environments | As CI; smoke flows after deploying to staging | All environments, real devices or systems |
| Snapshot | - | Affected outputs | All, main environment | All, each environment with baselines | As CI | - |
| Delivery | - | When packaging, migrations or permissions changed | Same | Main platform | Deploying to staging is one | All platforms, upgrade from the last release |
| Non-functional | - | - | When a change may move a target | The fast part (security scan, artifact size), blocking only as "Checks that change with the outside world" says | Scheduled (nightly or weekly) | All, compared with the last release |

"While coding" is the repeated run inside one small step: watch mode or only the tests just changed, results in seconds.

In a stack of PRs, the before-the-PR column runs once, on the top. After a rebase, rerun only what the rebase touched; a rebase that settled no conflict and only moved the base forward is left to CI. When CI fails, reproduce it locally with the same command before pushing a fix.

## Thorough without being slow

1. Test at the lowest level. Field rules and boundaries are unit tests; end-to-end covers key flows (the main path and the most important failure), not every input; snapshots cover key screens and states.
2. Select by change. The project states how a change maps to tests (by directory, by dependency, or the test tool's affected-tests option). When unsure, run more.
3. Run once, fix together. Before the PR, run every heavy check, collect all failures and fix them together; then rerun only what failed or was affected. CI runs everything again.
4. Prepare once, reuse. Cache dependencies, builds, images, emulator and VM snapshots. Restore throwaway environments from snapshots. Reset test data by transaction rollback or template copy. Share one build across heavy checks.
5. Run in parallel whenever possible. Shard within a kind. Run different checks side by side when they share no resource (ports, directories, devices, displays, hardware) and the machine has the CPU and memory; make those resources configurable instead of forcing checks to run one at a time.
6. Widen environments by stage: one main environment while developing, a representative few in CI (lowest and highest supported versions, smallest and largest screens), all of them and real devices before release.
7. Update baselines only for intended changes, never the whole set.
8. Treat flaky tests as bugs. One rerun after a failure only tells whether it is flaky; a flaky test gets an issue and a fix, not routine reruns.
9. What this machine cannot run goes to CI or remote devices, and the report says "not run locally" instead of passed.
10. Give the before-commit and before-PR stages a time target. When one is exceeded, select by change, shard, cache or move a check to a later stage; do not drop it.

## Checks that change with the outside world

Some checks give a different answer tomorrow without any change of yours: dependency vulnerability scans (a new advisory is published), link checks, contract tests against someone else's service, anything compared with a moving external reference. Run on every PR, they turn unrelated PRs red and cannot be fixed by the change, which breaks the rule that a CI failure is reproduced and fixed by the change.

- A PR is blocked only for what it can act on: a finding that is new compared with the base branch, or one of high or critical severity in what ships (runtime dependencies, not development tools; the production build, not test fixtures). Everything else goes to a scheduled run that opens an issue.
- When a PR fails on something the change did not cause, the report says so. The fix goes into its own PR, or into an issue, and is not mixed into the change.
- The scheduled run (nightly or weekly) covers the whole result, including what the PR check lets through, and opens or updates one issue per finding.

## Pull request size

One issue is one PR. Split only when a reviewer cannot read the diff in one sitting, along lines that merge on their own and leave the product working (refactoring first, the feature last). Roadmaps do not cut work into many small issues: each PR pays for a full CI run, a review and a merge wait. Review fixes stay in the same PR and rerun only the affected checks.

## What each kind needs from the project

When the project uses a kind, the scaffold skill sets up, besides the tests themselves:

- a project command that prepares and cleans up its own throwaway environment, in one step, whether the run passed or failed;
- ports and paths that are configurable (an environment variable with a default), never fixed in the code;
- the way to run only what a change affects (step 2 above);
- a CI job (the scheduled workflow for non-functional tests and for the checks that change with the outside world), with an environment matrix where the stage table asks for one;
- an entry in the Tests section of CLAUDE.md.
