# Test subjects, metrics and timings

Reference list for architect step 10 and for the implement step. It says, for each test subject, what runs and what is replaced by a test double, where the cases come from, what runs when the agent selects only the affected tests, and what not to write. It then maps metrics to subjects and lists the timings each subject and static check suits. Read it, consider the project, and decide; search online when a project needs something this list does not cover.

A test belongs to exactly one subject, decided by what runs for real and what is a double:

| # | Subject | Runs for real | Test doubles | Projects that need it |
|---|---|---|---|---|
| 1 | Unit | One function or class | Everything it depends on | Every project |
| 2 | Component | One UI component or one page | The backend interfaces | Projects with a UI |
| 3 | Integration | The backend from its entry point, with a real database, queue or cache | The frontend, third-party services | Projects with a database, queue, cache or external interface |
| 4 | Contract | Each side on its own, against one shared contract file | The other side | Separately deployed and released services, or callers outside the team's control |
| 5 | End-to-end | The whole system: frontend, backend, database | Third-party services only | Applications with user journeys |
| 6 | Performance and load | The whole system or one interface, under many requests | Third-party services | Projects with performance metrics; run only through /perf-test |
| 7 | Security | The backend with a real database; optionally the automatic security scan of the whole system | Third-party services | Projects with sign-in, permissions, or a public site or interface |
| 8 | Migration | The migration program with data in the previous version's format | Nothing | Projects with incrementally migrated data |

The same rule may be tested at several levels on purpose: end-to-end proves the journey works, integration proves each interface's rules, unit proves each business rule. Edge cases are tested only at the lowest level that can see them; end-to-end covers the main journey and the most important failure journeys, or the suite becomes slow and flaky.

Accessibility checks and screenshot comparison are checks inside component and end-to-end tests, not subjects of their own.

Every test runs in a throwaway environment its command starts and removes, except the smoke tests and the performance tests, which run against a deployed target. Those create and remove their own data as `../../issue/workflow.md` says ("Tests against deployed targets").

## Each subject

### 1. Unit

- **Tests** one function or class. Its database, other services, the current time and random numbers are doubles.
- **Cases come from** the business rules in the design: at least one case per rule; one per row of a decision table; in a state machine, one per allowed transition and one per forbidden transition; boundary values for calculations (zero, negative, maximum, empty); one per error path.
- **Affected selection**: the tests of the changed code, plus the tests the build tool computes as affected.
- **Not written for** methods that only pass a call on and hold no logic.

### 2. Component

- **Tests** one component or page rendered on its own, with backend interfaces replaced by doubles returning fixed data. A page is a component too: its test uses its real child components and only doubles the interfaces, so three components on a page have three tests of their own and the page has one more test of how they fit together.
- **Cases come from** each screen's states and actions in the design: one case per state (empty, loading, error, with data); one per validation rule of each field, checking the error message matches the design; the result of each action.
- **Also checks** accessibility, languages and screen sizes where the metrics ask for them, and takes the screenshots for comparison: one per state and per screen size.
- **Affected selection**: the changed components and pages, and the pages that use them.

### 3. Integration

- **Tests** the backend from its entry point (an HTTP interface, an incoming message, a scheduled job), connected to a real database, queue or cache started in a container, all the way to the data being written.
  - Requests from the frontend are built by the test from the interface definitions in the design.
  - Third-party services are doubles, such as WireMock.
- **Cases come from** each interface in the design: success; each kind of validation failure; not found; conflicts (duplicate submission, two people changing the same data at the same time). Each database query is tested against the real database.
- **The database** is built from empty by the migration program, never by an ORM's automatic table creation, so the tested schema is exactly the deployed one; SQL or a mapping that still uses a dropped column fails here.
- **Affected selection**: the tests of the changed interfaces and queries. Links no tool can see, such as SQL, interfaces and messages, are judged by reading the code.

### 4. Contract

- **Needed when** two services are deployed and released separately, or callers outside the team's control use an interface. A frontend and backend in one repository, deployed together, do not need it.
- **Tests** only that the agreed format still matches, without the whole journey: the caller's tests record "I send this request and expect this response" in a contract file (Pact is the usual tool), and the provider's tests replay the file against itself and check the fields and formats. Each side runs alone. It catches a provider renaming a field the caller still uses.
- **Cases come from** every interface and field the caller really uses.

### 5. End-to-end

- **Cases come from** the issue's acceptance criteria and the screen flows in the design: one test per typical journey, for example open orders → set filters and sorting → search → open a record → change it → go back → delete it. Signing in and out is a test of its own.
- **Each test is independent**: it prepares its own data and does not rely on another test running first; signing in uses a saved session (Playwright's storage state), not the sign-in page in every test.
- **Covers** the main journeys and the most important failure journeys, such as the message shown without permission.
- **Smoke tests** are a few end-to-end tests tagged smoke, for targets with an address: at first only that the address answers normally, later the most basic use of what the project has grown into. The tests tagged production-safe change nothing and are the only ones run on production.
- **Affected selection**: the journeys that pass through the changed screens or interfaces.

### 6. Performance and load

- **Cases come from** the performance metrics in the architecture, for example "95% of order-list requests return within 300 ms with 200 users online". Only flows with a metric get a load script.
- **Written by** the issue that builds or changes a flow a metric names; it writes or updates that flow's script.
- **Runs** only through `/perf-test <target>`, in a manually started CI/CD job against a deployment target, with the load coming from where architect step 10 chose.
- **Fails** when a result exceeds its metric.

### 7. Security

| | Security test cases (always) | Automatic security scan (optional) |
|---|---|---|
| What | Tests the agent writes for high-risk interfaces | A program such as ZAP crawls the running system and sends common attacks; no cases are written |
| Based on | The permissions in the design | Nothing |
| Runs | With the integration test tools | In CI only, against the throwaway environment the test command starts, entering where users enter; which components that environment holds follows architect step 8 |
| Finds | Access without signing in; an ordinary user calling an administrator interface; user A changing an id in the URL and seeing user B's data; malicious input (SQL, script) being executed | Configuration problems: missing security headers, cookies without secure flags, exposed software versions, common injections |

- **High-risk changes**: sign-in and permissions; places that take user input and store or show it; file upload; payments and amounts; administration; public interfaces.
- **Affected selection**: when the change touches a high-risk place, write or update its security cases and run them; otherwise none.

### 8. Migration

- **Tests** that this issue's new migration script brings data in the **previous** version's format to the new version. Only previous → new; older versions are the older scripts' job, applied in order when versions are skipped. Whether the program works on the new format is for the other subjects.
- **Optional**: without it, the merged script runs on staging and the real old data there is the check.
- **Cases**, in four steps:
  1. Bring a throwaway database or file directory to the previous version with the tool's "migrate to version" feature.
  2. Put in data of the previous format with raw statements or raw files, not with today's code, which already writes the new format. Include typical data and edge data: empty values, maximum lengths, special characters.
  3. Run the same migration command the deployment runs.
  4. Check that the tool records the new version, the format is new, and the data is all there, converted as designed.
- **Preparing each kind of data**: a database in Testcontainers; files in object storage with an emulator such as MinIO, LocalStack or Azurite, with old-format files and metadata; on-device stores with the platform's own tools, such as Android Room's `MigrationTestHelper` or drift's `SchemaVerifier` for Flutter.
- **A migration program the project writes itself** is also tested for three behaviors: it applies scripts in order, records which versions ran, and stops with an error when a script that already ran has changed. A migration tool already does these, so they are not tested again.
- **Affected selection**: runs when the issue wrote a migration script.

## Metrics become checks

Every metric and requirement in the architecture and the brief that a test can check becomes a check in some subject, and the architecture's test section names the subject.

| Metric or requirement | Written in | Subject | How |
|---|---|---|---|
| Accessibility, e.g. WCAG 2.2 AA | Architecture | Component, end-to-end | axe on every state |
| Supported browsers and devices | Architecture | End-to-end | The end-to-end tests on every browser and device, before a release |
| Performance, resources | Architecture | Performance and load | Section 6 |
| Security | Architecture | Security | Section 7 |
| Screen text languages | Brief | Component | Render each language once: no untranslated text, long text does not overflow |
| Screen sizes | Brief, architecture | Component (screenshots) | One screenshot per size |

## Timings

The seven timings are: before commit, before push, before the PR, PR CI, after merging to `main`, after deploying to staging (only with staging), and before a release (the release PR's CI). The table lists the timings each check usually suits; the architect step decides per project. The checks placed at PR CI are the required checks.

| Check | Usually runs at |
|---|---|
| Format, lint, secret leaks, container and deployment configuration, document format | Before commit (staged files), PR CI |
| Commit message format, step check | The commit-msg hook, PR CI |
| Type check, compile and build | Before push, PR CI, after merging |
| Architecture rules, duplicate code | Before the PR, PR CI |
| Code security scan, dependency vulnerabilities, licenses | PR CI, before a release |
| AI simplification | Before the PR |
| AI review, AI security review | Before the PR, PR CI |
| Unit | Before push (affected), before the PR, PR CI, after merging |
| Component, integration, contract, security cases | Before the PR, PR CI, after merging |
| End-to-end | Before the PR (affected), PR CI, after merging; before a release on every supported browser and device |
| Smoke | After every deployment: all of them on staging, the production-safe ones on production |
| Automatic security scan | PR CI or after merging, before a release |
| Migration | Before the PR and PR CI when a migration script changed, before a release |
| Performance and load | Only `/perf-test` |

Local runs and CI run the same tests with the same commands. They differ only in how much runs (CI runs everything; locally, each heavy subject runs in full or only what the agent judges affected, as the architect step set), in CI's clean machine every time, and in the tests that need a deployment, which neither runs. Techniques for selecting affected tests are in `test-tools.md`, Part B, "Affected-test selection".
