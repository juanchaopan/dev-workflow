# Test tools reference

Reference list for the architect step. An agent reads it to propose, for each kind of test the project uses, one or more tools that fit the chosen stack. It is a starting point, not a configuration: the agent proposes, the user chooses, and the scaffold step installs the latest release from the place given in the "Published at" column.

Researched on 2026-11-17. Version numbers are left out on purpose; look them up at install time.

## How to use this list

1. Find the stack in **Part A**. It lists the tools tied to one language: unit test framework, mocking, UI component testing, snapshot or approval testing, property-based testing, coverage and stack-specific end-to-end tools.
2. Find the cross-stack kinds in **Part B**: integration support, end-to-end (web, mobile, desktop, API, CLI), visual regression, contract, performance and load, accessibility, DAST, affected-test selection, cloud service emulators and device emulators.
3. Rows marked `*` are the usual default for that stack. Offer it first and name one or two alternatives with the trade-off.
4. Do not offer anything listed in **Part C (dead or replaced)**. If the project already uses one, say so and offer the replacement.
5. Before installing, check the "Published at" source for the latest release and for license changes. Licenses have moved from open source to commercial several times (FluentAssertions, NBomber, LocalStack, AltTester).
6. For a stack missing here, follow **Part D**.

## Legend

| Column | Values |
|---|---|
| Needs | `—` nothing beyond the language toolchain · `Docker` a container runtime · `Browser` a real browser (usually downloaded by the tool) · `Emulator` Android emulator, iOS simulator or a device · `macOS` / `Windows` / `Linux` runs only there · `JVM` needs a Java runtime · `SaaS` sends results to a hosted service · `Account` needs a vendor account or key |
| Published at | `npm:` npmjs.com · `mvn:` Maven Central (`group:artifact`) · `nuget:` nuget.org · `pypi:` pypi.org · `crates:` crates.io · `go:` Go module path (versions on pkg.go.dev) · `packagist:` · `gem:` rubygems.org · `hex:` hex.pm · `hackage:` · `opam:` · `clojars:` · `cran:` · `jl:` Julia General registry · `luarocks:` · `cpan:` metacpan.org · `pub:` pub.dev · `gh:` GitHub releases of `owner/repo` · `spm:` Swift package from that GitHub repo · `docker:` container image · `upm:` Unity Package Manager · `bundled` ships with the language, SDK or engine, so its latest version is the toolchain's |
| `?` | The value after which it appears was not confirmed on the project's own page during this research. |
| `[low activity]` | Not archived, but releases or commits are rare; check liveness (Part D) before proposing. |

---

## Part A — Tools tied to one stack

### TypeScript / JavaScript (Node, React, Vue, Angular, Svelte)

| Kind | Tool | For | License | Needs | Published at |
|---|---|---|---|---|---|
| Unit | Vitest* | Vite-native runner, Jest-compatible API; default for new Angular CLI projects | MIT | — | npm:vitest |
| Unit | Jest | Long-standing runner, large plugin ecosystem | MIT | — | npm:jest |
| Unit | node:test | Built-in Node runner, no dependencies | MIT | — | bundled (Node) |
| Unit | Mocha / Jasmine | Older BDD runners; Jasmine still used in Angular projects not yet migrated | MIT | — | npm:mocha, npm:jasmine |
| Unit | Bun test / Deno test | Built-in runners of those runtimes | MIT | — | bundled |
| Unit | Web Test Runner | Runs tests in real browsers | MIT | Browser | npm:@web/test-runner |
| Mocking | Vitest `vi` / Jest `jest.fn` | Built-in spies, module mocks, fake timers | MIT | — | with runner |
| Mocking | Sinon | Standalone spies, stubs, fake timers | BSD-3-Clause | — | npm:sinon |
| Mocking | MSW (Mock Service Worker) | Mocks HTTP/GraphQL at the network layer, Node and browser | MIT | — | npm:msw |
| Mocking | nock | HTTP mocking for Node | MIT | — | npm:nock |
| Component | Testing Library (React, Vue, Svelte, Angular, DOM) | Renders components and queries them the way users do | MIT | — (jsdom) or Browser | npm:@testing-library/react, …/vue, …/svelte, …/angular |
| Component | Vue Test Utils | Official Vue component mounting | MIT | — | npm:@vue/test-utils |
| Component | Angular TestBed | Official Angular component test harness | MIT | — | bundled (@angular/core/testing) |
| Component | Vitest Browser Mode* | Component tests in a real browser via Playwright or WebdriverIO provider; stable since Vitest 4 | MIT | Browser | npm:vitest, npm:@vitest/browser-playwright |
| Component | Storybook + Vitest addon | Stories become component tests run in Vitest browser mode | MIT | Browser | npm:storybook, npm:@storybook/addon-vitest |
| Component | Cypress Component Testing | Mounts components in Cypress | MIT | Browser | npm:cypress |
| Component | Playwright Component Testing | Experimental; API may change between releases; Svelte package removed | Apache-2.0 | Browser | npm:@playwright/experimental-ct-react (…-vue) |
| Snapshot | Vitest / Jest snapshots* | `toMatchSnapshot`, inline snapshots | MIT | — | with runner |
| Property | fast-check* | Property-based testing with shrinking; integrates with any runner | MIT | — | npm:fast-check |
| Coverage | V8 coverage (Vitest `@vitest/coverage-v8`, c8)* | Native V8 coverage | MIT / ISC | — | npm:@vitest/coverage-v8, npm:c8 |
| Coverage | Istanbul (nyc, `@vitest/coverage-istanbul`) | Instrumenting coverage | BSD-3-Clause | — | npm:nyc |
| API (in-process) | supertest | HTTP assertions against a Node server without opening a port | MIT | — | npm:supertest |

### Java

| Kind | Tool | For | License | Needs | Published at |
|---|---|---|---|---|---|
| Unit | JUnit (Jupiter)* | Standard JVM test framework | EPL-2.0 | JVM | mvn:org.junit:junit-bom |
| Unit | TestNG | Alternative with groups, dependencies, data providers | Apache-2.0 | JVM | mvn:org.testng:testng |
| Unit | Spock | Groovy-based specification framework | Apache-2.0 | JVM | mvn:org.spockframework:spock-core |
| Assertions | AssertJ* | Fluent assertions | Apache-2.0 | JVM | mvn:org.assertj:assertj-core |
| Mocking | Mockito* | Mocks, spies, static and final mocking | MIT | JVM | mvn:org.mockito:mockito-core |
| Mocking | EasyMock | Older mocking library | Apache-2.0 | JVM | mvn:org.easymock:easymock |
| Mocking (HTTP) | WireMock | HTTP stub server, in-process or standalone | Apache-2.0 | JVM or Docker | mvn:org.wiremock:wiremock, docker:wiremock/wiremock |
| Mocking (HTTP) | MockServer | HTTP(S) mock and proxy | Apache-2.0 | JVM or Docker | mvn:org.mock-server:mockserver-netty |
| Framework slices | Spring Boot Test | `@SpringBootTest`, `@WebMvcTest`, `@DataJpaTest`, MockMvc | Apache-2.0 | JVM | mvn:org.springframework.boot:spring-boot-starter-test |
| Architecture | ArchUnit | Unit tests for package and layer rules | Apache-2.0 | JVM | mvn:com.tngtech.archunit:archunit |
| Snapshot | ApprovalTests.Java | Approval (golden-file) testing | Apache-2.0 | JVM | mvn:com.approvaltests:approvaltests |
| Snapshot | Selfie | Inline and disk snapshots (also Kotlin, JS, Python) | Apache-2.0 ? | JVM | mvn:com.diffplug.selfie:selfie-runner-junit5 |
| Property | jqwik* | Property-based testing engine for JUnit Platform | EPL-2.0 | JVM | mvn:net.jqwik:jqwik |
| Coverage | JaCoCo* | Bytecode coverage | EPL-2.0 | JVM | mvn:org.jacoco:jacoco-maven-plugin |
| BDD | Cucumber-JVM | Gherkin scenarios | MIT | JVM | mvn:io.cucumber:cucumber-java |
| Micro-benchmark | JMH | JVM micro-benchmarks | GPL-2.0 with Classpath Exception | JVM | mvn:org.openjdk.jmh:jmh-core |

### Kotlin (JVM, Multiplatform, Android)

All JVM tools above also work for Kotlin.

| Kind | Tool | For | License | Needs | Published at |
|---|---|---|---|---|---|
| Unit | Kotest* | Spec styles, assertions, property testing, Multiplatform | Apache-2.0 | — | mvn:io.kotest:kotest-runner-junit5 |
| Unit | kotlin.test | Multiplatform assertions over JUnit/JS/native runners | Apache-2.0 | — | bundled (Kotlin) |
| Mocking | MockK* | Kotlin-first mocking (coroutines, objects, extension functions) | Apache-2.0 | JVM | mvn:io.mockk:mockk |
| Mocking | Mokkery | Mocking for Kotlin Multiplatform via compiler plugin | Apache-2.0 | — | mvn:dev.mokkery:mokkery-runtime |
| Flows | Turbine | Testing Kotlin Flows | Apache-2.0 | — | mvn:app.cash.turbine:turbine |
| Android unit | Robolectric* | Android framework on the JVM, no emulator | MIT | JVM | mvn:org.robolectric:robolectric |
| Android UI component | Compose UI test* | `createComposeRule`, semantics tree queries; runs on Robolectric or device | Apache-2.0 | — or Emulator | Google Maven: androidx.compose.ui:ui-test-junit4 |
| Android UI | Espresso | View-based UI tests inside the app process | Apache-2.0 | Emulator | Google Maven: androidx.test.espresso:espresso-core |
| Android UI | UI Automator | Cross-app and system UI automation | Apache-2.0 | Emulator | Google Maven: androidx.test.uiautomator:uiautomator |
| Android UI | Kaspresso | Wrapper over Espresso/UI Automator with flakiness protection | Apache-2.0 | Emulator | mvn:com.kaspersky.android-components:kaspresso |
| Screenshot | Paparazzi | Renders Android views/Compose on the JVM and compares images | Apache-2.0 | JVM | mvn:app.cash.paparazzi:paparazzi |
| Screenshot | Roborazzi | Screenshot tests on Robolectric (Android, Compose Multiplatform) | Apache-2.0 | JVM | mvn:io.github.takahirom.roborazzi:roborazzi |
| Screenshot | Compose Preview Screenshot Testing | Google's screenshot tests from `@Preview`; experimental ? | Apache-2.0 | JVM | Google Maven: com.android.compose.screenshot |
| Accessibility | Accessibility Test Framework for Android | Checks in Espresso/Robolectric tests | Apache-2.0 | — or Emulator | Google Maven: com.google.android.apps.common.testing.accessibility.framework |
| Property | Kotest property | Generators and shrinking inside Kotest | Apache-2.0 | — | mvn:io.kotest:kotest-property |
| Coverage | Kover* | Kotlin coverage plugin for Gradle | Apache-2.0 | JVM | Gradle Plugin Portal: org.jetbrains.kotlinx.kover |

### C# / .NET (ASP.NET Core, Blazor, MAUI)

| Kind | Tool | For | License | Needs | Published at |
|---|---|---|---|---|---|
| Unit | xUnit.net v3* | Most common .NET test framework | Apache-2.0 | — | nuget:xunit.v3 |
| Unit | NUnit | Attribute-rich framework, parameterized tests | MIT | — | nuget:NUnit |
| Unit | MSTest | Microsoft's framework, built on Microsoft.Testing.Platform | MIT | — | nuget:MSTest |
| Unit | TUnit | Source-generated, parallel by default, Microsoft.Testing.Platform only | MIT | — | nuget:TUnit |
| Assertions | AwesomeAssertions | Community fork of FluentAssertions under Apache-2.0 | Apache-2.0 | — | nuget:AwesomeAssertions |
| Assertions | FluentAssertions | v8+ needs a paid license for commercial use (Xceed); v7 stays Apache-2.0 | Commercial (v8+) | — | nuget:FluentAssertions |
| Assertions | Shouldly | Readable assertion messages | BSD-3-Clause ? | — | nuget:Shouldly |
| Mocking | NSubstitute* | Concise mocking | BSD-3-Clause | — | nuget:NSubstitute |
| Mocking | Moq | Widely used mocking library | BSD-3-Clause | — | nuget:Moq |
| Mocking | FakeItEasy | Mocking with fluent API | MIT | — | nuget:FakeItEasy |
| Mocking (HTTP) | WireMock.Net | HTTP stub server in-process | Apache-2.0 | — | nuget:WireMock.Net |
| Integration | WebApplicationFactory | In-memory ASP.NET Core host for HTTP tests | MIT | — | nuget:Microsoft.AspNetCore.Mvc.Testing |
| Integration | Aspire testing | Starts an Aspire app model (containers and projects) in tests | MIT | Docker | nuget:Aspire.Hosting.Testing |
| Integration | Respawn | Resets database state between tests | Apache-2.0 | — | nuget:Respawn |
| Component (Blazor) | bUnit* | Renders Blazor components, inspects markup, fires events | MIT | — | nuget:bunit |
| Component (Avalonia) | Avalonia.Headless | Headless UI tests for Avalonia apps | MIT | — | nuget:Avalonia.Headless.XUnit |
| Snapshot | Verify* | Snapshot/approval testing for objects, HTTP, images, EF queries | MIT | — | nuget:Verify.Xunit (…NUnit, …MSTest, …TUnit) |
| Property | FsCheck | QuickCheck port, usable from C# | BSD-3-Clause | — | nuget:FsCheck |
| Property | CsCheck | C#-first property testing, also concurrency checks | Apache-2.0 | — | nuget:CsCheck |
| Coverage | coverlet* | Cross-platform coverage collector | MIT | — | nuget:coverlet.collector |
| Coverage | Microsoft.Testing.Extensions.CodeCoverage | Microsoft's collector for Microsoft.Testing.Platform | Microsoft license (free) ? | — | nuget:Microsoft.Testing.Extensions.CodeCoverage |
| Coverage report | ReportGenerator | Merges coverage files into HTML/Cobertura | Apache-2.0 | — | nuget:dotnet-reportgenerator-globaltool |
| BDD | Reqnroll | Gherkin for .NET; successor of SpecFlow | BSD-3-Clause | — | nuget:Reqnroll |
| MAUI UI | Appium (UiAutomator2, XCUITest, Windows, Mac2 drivers) | Device-level UI tests of MAUI apps | Apache-2.0 | Emulator | npm:appium |

### F#

| Kind | Tool | For | License | Needs | Published at |
|---|---|---|---|---|---|
| Unit | Expecto* | Tests as values, parallel, F#-first | Apache-2.0 | — | nuget:Expecto |
| Unit | xUnit / NUnit + FsUnit | .NET frameworks with F# assertion syntax | MIT | — | nuget:FsUnit.xUnit |
| Assertions | Unquote | Quoted-expression assertions with step-by-step failure output | Apache-2.0 | — | nuget:Unquote |
| Property | FsCheck* | QuickCheck for .NET | BSD-3-Clause | — | nuget:FsCheck |
| Property | Hedgehog | Integrated shrinking | Apache-2.0 | — | nuget:Hedgehog |
| Mocking | Object expressions / NSubstitute | F# object expressions often replace mocks; NSubstitute works for interfaces | — / BSD-3-Clause | — | nuget:NSubstitute |
| Snapshot, coverage | Verify, coverlet | Same as C# | see C# | — | see C# |

### Python

| Kind | Tool | For | License | Needs | Published at |
|---|---|---|---|---|---|
| Unit | pytest* | De-facto runner, fixtures, plugins | MIT | — | pypi:pytest |
| Unit | unittest | Standard-library xUnit framework | PSF | — | bundled |
| Mocking | unittest.mock + pytest-mock* | Mocks and patching; pytest fixture wrapper | PSF / MIT | — | bundled, pypi:pytest-mock |
| Mocking (HTTP) | respx / responses | Mock httpx / requests | BSD-3-Clause / Apache-2.0 | — | pypi:respx, pypi:responses |
| Mocking (HTTP) | vcrpy | Record and replay HTTP | MIT | — | pypi:vcrpy |
| Time | time-machine / freezegun | Freeze or move time | MIT / Apache-2.0 | — | pypi:time-machine, pypi:freezegun |
| Snapshot | syrupy* | pytest snapshot plugin | Apache-2.0 | — | pypi:syrupy |
| Snapshot | inline-snapshot | Snapshots written back into the test source | MIT | — | pypi:inline-snapshot |
| Property | Hypothesis* | Property-based testing, stateful testing | MPL-2.0 | — | pypi:hypothesis |
| Coverage | coverage.py + pytest-cov* | Line and branch coverage | Apache-2.0 / MIT | — | pypi:coverage, pypi:pytest-cov |
| Web framework | pytest-django / Django test client, FastAPI TestClient | In-process HTTP tests | BSD-3-Clause / MIT | — | pypi:pytest-django |
| BDD | pytest-bdd / behave | Gherkin scenarios | MIT / BSD-2-Clause | — | pypi:pytest-bdd, pypi:behave |
| Acceptance | Robot Framework | Keyword-driven acceptance testing; Browser library uses Playwright | Apache-2.0 | — / Browser | pypi:robotframework, pypi:robotframework-browser |
| Benchmark | pytest-benchmark | Micro-benchmarks in pytest | BSD-2-Clause | — | pypi:pytest-benchmark |

### Go

| Kind | Tool | For | License | Needs | Published at |
|---|---|---|---|---|---|
| Unit | `testing` + `go test`* | Standard library tests, benchmarks, examples | BSD-3-Clause | — | bundled |
| Assertions | testify | Assertions, suites, simple mocks | MIT | — | go:github.com/stretchr/testify |
| BDD | Ginkgo + Gomega | BDD specs and matchers | MIT | — | go:github.com/onsi/ginkgo/v2 |
| Mocking | gomock (Uber fork)* | Generated mocks from interfaces | Apache-2.0 | — | go:go.uber.org/mock |
| Mocking | mockery | Generates testify mocks | BSD-3-Clause | — | gh:vektra/mockery |
| Mocking (HTTP) | `net/http/httptest` | In-process HTTP servers and recorders | BSD-3-Clause | — | bundled |
| Snapshot | go-snaps | Jest-like snapshots | MIT | — | go:github.com/gkampitakis/go-snaps |
| Property | rapid* | Generics-based property testing with automatic shrinking | MPL-2.0 | — | go:pgregory.net/rapid |
| Property | gopter | ScalaCheck-style property testing | MIT | — | go:github.com/leanovate/gopter [low activity ?] |
| Coverage | `go test -cover` / `go tool cover`* | Built-in coverage, including integration binaries | BSD-3-Clause | — | bundled |
| CLI | testscript | Script-driven CLI tests (used by the Go project itself) | BSD-3-Clause | — | go:github.com/rogpeppe/go-internal/testscript |

### Rust

| Kind | Tool | For | License | Needs | Published at |
|---|---|---|---|---|---|
| Unit | `#[test]` + `cargo test`* | Built-in unit, integration and doc tests | MIT/Apache-2.0 | — | bundled |
| Runner | cargo-nextest | Faster, isolated test runner with retries and partitioning | MIT/Apache-2.0 | — | crates:cargo-nextest |
| Fixtures | rstest | Fixtures and parameterized tests | MIT/Apache-2.0 | — | crates:rstest |
| Mocking | mockall* | Mock generation for traits | MIT/Apache-2.0 | — | crates:mockall |
| Mocking (HTTP) | wiremock / httpmock / mockito | HTTP mock servers | MIT/Apache-2.0 / MIT | — | crates:wiremock, crates:httpmock, crates:mockito |
| Snapshot | insta* | Snapshot testing with review tool (`cargo insta`) | Apache-2.0 | — | crates:insta |
| Property | proptest* | Strategy-based property testing with shrinking | MIT/Apache-2.0 | — | crates:proptest |
| Property | quickcheck | QuickCheck port | MIT/Unlicense | — | crates:quickcheck |
| Coverage | cargo-llvm-cov* | LLVM source-based coverage | MIT/Apache-2.0 | — | crates:cargo-llvm-cov |
| Coverage | cargo-tarpaulin | Coverage on Linux (ptrace) or LLVM | MIT/Apache-2.0 | — | crates:cargo-tarpaulin |
| Concurrency / UB | loom, Miri | Permutation testing of concurrent code; undefined-behaviour interpreter | MIT / MIT/Apache-2.0 | — | crates:loom, bundled (rustup component) |
| CLI | assert_cmd, trycmd, snapbox | Run binaries and assert output; file-based CLI cases | MIT/Apache-2.0 | — | crates:assert_cmd, crates:trycmd |
| Benchmark | criterion, divan | Statistical micro-benchmarks | MIT/Apache-2.0 | — | crates:criterion, crates:divan |

### PHP

| Kind | Tool | For | License | Needs | Published at |
|---|---|---|---|---|---|
| Unit | PHPUnit* | Standard xUnit framework | BSD-3-Clause | — | packagist:phpunit/phpunit |
| Unit | Pest | Expressive layer over PHPUnit; Laravel default | MIT | — | packagist:pestphp/pest |
| Unit / acceptance | Codeception | Unit, functional and acceptance in one | MIT | — / Browser | packagist:codeception/codeception |
| Mocking | Mockery* | Mock objects | BSD-3-Clause | — | packagist:mockery/mockery |
| Mocking | PHPUnit mocks / Prophecy | Built-in test doubles; Prophecy is older | BSD-3-Clause / MIT | — | packagist:phpspec/prophecy [low activity ?] |
| Snapshot | spatie/phpunit-snapshot-assertions | Snapshots for PHPUnit | MIT | — | packagist:spatie/phpunit-snapshot-assertions |
| Property | Eris | QuickCheck-style for PHPUnit | MIT | — | packagist:giorgiosironi/eris [low activity ?] |
| Coverage | PCOV* / Xdebug | Coverage drivers used by PHPUnit | PHP License / Xdebug License | — | pecl:pcov, xdebug.org |
| BDD | Behat | Gherkin scenarios | MIT | — | packagist:behat/behat |
| Browser (framework) | Laravel Dusk / Symfony Panther | Browser tests from the framework | MIT | Browser | packagist:laravel/dusk, packagist:symfony/panther |

### Ruby (including Rails)

| Kind | Tool | For | License | Needs | Published at |
|---|---|---|---|---|---|
| Unit | RSpec* | BDD framework | MIT | — | gem:rspec |
| Unit | Minitest | Rails default; xUnit and spec styles | MIT | — | gem:minitest |
| Mocking | rspec-mocks / mocha | Test doubles | MIT | — | gem:rspec-mocks, gem:mocha |
| Mocking (HTTP) | WebMock* | Stubs HTTP requests | MIT | — | gem:webmock |
| Mocking (HTTP) | VCR | Record and replay HTTP | Hippocratic-2.1 (not OSI) ? | — | gem:vcr |
| Fixtures | factory_bot | Test data factories | MIT | — | gem:factory_bot |
| Component | ViewComponent test helpers | Render components in isolation | MIT | — | gem:view_component |
| Snapshot | approvals | Approval testing | MIT ? | — | gem:approvals |
| Property | prop_check / Rantly | Property-based testing | MIT | — | gem:prop_check, gem:rantly [low activity ?] |
| Coverage | SimpleCov* | Coverage on Ruby's Coverage module | MIT | — | gem:simplecov |
| Browser | Capybara + Cuprite or Selenium | System tests; Cuprite drives Chrome over CDP | MIT | Browser | gem:capybara, gem:cuprite |
| CLI | Aruba | CLI testing with RSpec/Cucumber | MIT | — | gem:aruba |

### Swift (iOS, macOS, server)

| Kind | Tool | For | License | Needs | Published at |
|---|---|---|---|---|---|
| Unit | Swift Testing* | Apple's macro-based framework (`@Test`, `#expect`) | Apache-2.0 | — | bundled (Xcode / Swift toolchain) |
| Unit | XCTest | Classic framework; needed for UI and performance tests | Apple / Apache-2.0 (corelibs) | — | bundled |
| Unit | Quick + Nimble | BDD specs and matchers | Apache-2.0 | — | spm:Quick/Quick, spm:Quick/Nimble |
| Mocking | Protocols + hand-written fakes / swift-dependencies | Swift has no runtime mocking; dependency injection is the norm | MIT | — | spm:pointfreeco/swift-dependencies |
| Mocking | Mockolo / Cuckoo | Generated mocks from protocols | Apache-2.0 / MIT | — | gh:uber/mockolo, spm:Brightify/Cuckoo |
| Component (SwiftUI) | ViewInspector | Inspects SwiftUI view hierarchies in unit tests | MIT | — | spm:nalexn/ViewInspector |
| Snapshot | swift-snapshot-testing* | Image, text and data snapshots (views, view controllers, any value) | MIT | Simulator for UIKit/SwiftUI images | spm:pointfreeco/swift-snapshot-testing |
| E2E (iOS) | XCUITest* | Black-box UI tests on simulator or device; `performAccessibilityAudit` for a11y | Apple | macOS, Emulator | bundled (Xcode) |
| E2E (iOS) | EarlGrey 2 | Google's white-box UI framework on top of XCUITest | Apache-2.0 | macOS, Emulator | gh:google/EarlGrey (earlgrey2 branch) [low activity ?] |
| Property | SwiftCheck | QuickCheck port | MIT | — | spm:typelift/SwiftCheck [low activity ?] |
| Coverage | Xcode coverage (`xccov`) / `swift test --enable-code-coverage`* | Built-in LLVM coverage | Apple / Apache-2.0 | — | bundled |
| Coverage report | Slather | Converts Xcode coverage to Cobertura/HTML | MIT | macOS | gem:slather |
| Accessibility | GTXiLib | Accessibility checks in XCTest | Apache-2.0 | macOS, Emulator | gh:google/GTXiLib |

### Objective-C

| Kind | Tool | For | License | Needs | Published at |
|---|---|---|---|---|---|
| Unit | XCTest* | Standard framework | Apple | macOS | bundled |
| Mocking | OCMock* | Mock objects for Objective-C | Apache-2.0 | macOS | gh:erikdoe/ocmock [low activity ?] |
| Matchers | OCHamcrest | Hamcrest matchers | BSD-2-Clause ? | macOS | gh:hamcrest/OCHamcrest |
| Snapshot | iOSSnapshotTestCase | Image snapshots of views (formerly FBSnapshotTestCase) | MIT | Simulator | gh:uber/ios-snapshot-test-case [low activity ?] |
| E2E, coverage | XCUITest, Xcode coverage | Same as Swift | Apple | macOS | bundled |

### Dart / Flutter

| Kind | Tool | For | License | Needs | Published at |
|---|---|---|---|---|---|
| Unit | package:test* | Dart unit tests | BSD-3-Clause | — | pub:test |
| Component (widget) | flutter_test* | Widget tests without a device, `meetsGuideline` a11y checks | BSD-3-Clause | — | bundled (Flutter SDK) |
| Mocking | mocktail* | Mocks without code generation | MIT | — | pub:mocktail |
| Mocking | mockito (Dart) | Generated mocks | Apache-2.0 | — | pub:mockito |
| State | bloc_test | Tests for Bloc/Cubit | MIT | — | pub:bloc_test |
| Snapshot (golden) | `matchesGoldenFile`* / Alchemist | Golden image tests; Alchemist adds CI-stable goldens | BSD-3-Clause / MIT | — | bundled, pub:alchemist |
| E2E | integration_test* | Runs the app on a device or emulator, driven from Dart | BSD-3-Clause | Emulator | bundled (Flutter SDK) |
| E2E | Patrol | integration_test plus native UI (permissions, notifications) | Apache-2.0 | Emulator | pub:patrol, pub:patrol_cli |
| Property | glados | Property-based testing | MIT ? | — | pub:glados [low activity ?] |
| Coverage | `flutter test --coverage` / package:coverage* | LCOV output | BSD-3-Clause | — | bundled, pub:coverage |

### C (including embedded)

| Kind | Tool | For | License | Needs | Published at |
|---|---|---|---|---|---|
| Unit | Unity (ThrowTheSwitch)* | Tiny C test framework for embedded targets | MIT | — | gh:ThrowTheSwitch/Unity |
| Mocking | CMock | Generates mocks from C headers, pairs with Unity | MIT | Ruby (generator) | gh:ThrowTheSwitch/CMock |
| Build / runner | Ceedling | Build system and runner for Unity + CMock, host or target | MIT | Ruby | gem:ceedling |
| Unit | CppUTest | C/C++ unit tests and mocks, embedded friendly | BSD-3-Clause | — | gh:cpputest/cpputest |
| Unit | cmocka | Unit tests with mock objects | Apache-2.0 | — | cmocka.org, distro packages |
| Unit | Criterion / Check / greatest / acutest | Other C frameworks (Check needs fork) | MIT / LGPL-2.1 / ISC / MIT | — | gh:Snaipe/Criterion, gh:libcheck/check |
| Mocking | fff (Fake Function Framework) | Header-only fakes for C functions | MIT | — | gh:meekrosoft/fff |
| Property | theft | Property-based testing for C | ISC | — | gh:silentbicycle/theft [low activity] |
| Coverage | gcov + gcovr / lcov*, llvm-cov | Compiler coverage and reports | GPL / BSD-3-Clause / GPL-2.0 / Apache-2.0 | — | bundled (GCC/LLVM), pypi:gcovr |
| Target simulation | Renode, QEMU | Run firmware tests without hardware (Part B, device emulators) | MIT / GPL-2.0 | — | gh:renode/renode, qemu.org |

### C++

| Kind | Tool | For | License | Needs | Published at |
|---|---|---|---|---|---|
| Unit | GoogleTest* | xUnit framework with death tests, parameterized tests | BSD-3-Clause | — | gh:google/googletest, vcpkg/Conan: gtest |
| Unit | Catch2 | BDD-style sections, benchmarks | BSL-1.0 | — | gh:catchorg/Catch2, vcpkg/Conan: catch2 |
| Unit | doctest | Very fast single-header framework | MIT | — | gh:doctest/doctest |
| Unit | Boost.Test | Part of Boost | BSL-1.0 | — | bundled (Boost) |
| Unit (embedded) | CppUTest | See C | BSD-3-Clause | — | gh:cpputest/cpputest |
| Unit (Qt) | Qt Test | Qt's framework, includes GUI event simulation | LGPL-3.0 / GPL / commercial | — | bundled (Qt) |
| Mocking | gMock* | Mocks with GoogleTest | BSD-3-Clause | — | with GoogleTest |
| Mocking | trompeloeil / FakeIt | Header-only mocking | BSL-1.0 / MIT | — | gh:rollbear/trompeloeil, gh:eranpeer/FakeIt |
| Snapshot | ApprovalTests.cpp | Approval testing | Apache-2.0 | — | gh:approvals/ApprovalTests.cpp |
| Property | RapidCheck | QuickCheck for C++ | BSD-2-Clause | — | gh:emil-e/rapidcheck [low activity ?] |
| Coverage | gcovr, llvm-cov, OpenCppCoverage (Windows) | Coverage | BSD-3-Clause / Apache-2.0 / GPL-3.0 | — / Windows | pypi:gcovr, gh:OpenCppCoverage/OpenCppCoverage [low activity] |
| Benchmark | Google Benchmark | Micro-benchmarks | Apache-2.0 | — | gh:google/benchmark |
| GUI (Qt) | Squish | Qt/desktop/embedded GUI automation | Commercial | — | qt.io |

### Scala

| Kind | Tool | For | License | Needs | Published at |
|---|---|---|---|---|---|
| Unit | MUnit* | Lightweight, Scala 2 and 3 | Apache-2.0 | JVM | mvn:org.scalameta:munit_3 |
| Unit | ScalaTest | Many spec styles | Apache-2.0 | JVM | mvn:org.scalatest:scalatest_3 |
| Unit | specs2 / weaver-test / ZIO Test / uTest | specs2 BDD; weaver for Cats Effect; ZIO Test for ZIO | MIT / Apache-2.0 / Apache-2.0 / MIT | JVM | mvn:org.specs2, mvn:org.typelevel:weaver-cats_3, mvn:dev.zio:zio-test_3 |
| Mocking | ScalaMock* | Scala-native mocking, Scala 2 and 3 | MIT | JVM | mvn:org.scalamock:scalamock_3 |
| Mocking | mockito-scala | Mockito wrapper; reported unmaintained and without Scala 3 support ? | MIT | JVM | mvn:org.mockito:mockito-scala_2.13 [low activity ?] |
| Property | ScalaCheck* | Property-based testing | BSD-3-Clause | JVM | mvn:org.scalacheck:scalacheck_3 |
| Coverage | scoverage* | Statement coverage (sbt, Maven, Gradle) | Apache-2.0 | JVM | mvn:org.scoverage (sbt-scoverage) |
| Integration | testcontainers-scala | Scala wrapper for Testcontainers | MIT | Docker | mvn:com.dimafeng:testcontainers-scala-scalatest_3 |

### Elixir

| Kind | Tool | For | License | Needs | Published at |
|---|---|---|---|---|---|
| Unit | ExUnit* | Built-in framework, async tests, doctests | Apache-2.0 | — | bundled |
| Mocking | Mox* | Mocks bound to behaviours (explicit contracts) | Apache-2.0 | — | hex:mox |
| Mocking | Mimic / Mock | Module-level mocking | Apache-2.0 / MIT | — | hex:mimic, hex:mock |
| Mocking (HTTP) | Bypass / Req.Test | Fake HTTP server; Req's built-in stubs | MIT / Apache-2.0 | — | hex:bypass, hex:req |
| Component (Phoenix) | Phoenix.LiveViewTest / PhoenixTest | LiveView and controller tests without a browser | MIT | — | bundled (phoenix_live_view), hex:phoenix_test |
| Snapshot | Mneme | Auto-updating assertions (snapshot style) | MIT ? | — | hex:mneme |
| Property | StreamData* | Property-based testing and generators | Apache-2.0 | — | hex:stream_data |
| Coverage | `mix test --cover` / ExCoveralls* | Built-in cover; ExCoveralls for reports | Apache-2.0 / MIT | — | bundled, hex:excoveralls |
| Browser | Wallaby | Concurrent browser tests | MIT | Browser | hex:wallaby |
| Affected tests | `mix test --stale` | Runs tests whose modules or dependencies changed | Apache-2.0 | — | bundled |

### Erlang

| Kind | Tool | For | License | Needs | Published at |
|---|---|---|---|---|---|
| Unit | EUnit* | Lightweight unit tests | Apache-2.0 | — | bundled (OTP) |
| Integration | Common Test | System and integration test framework | Apache-2.0 | — | bundled (OTP) |
| Mocking | meck* | Module mocking | Apache-2.0 | — | hex:meck |
| Property | PropEr* | QuickCheck-inspired, stateful testing | GPL-3.0 | — | hex:proper |
| Property | Quviq QuickCheck | Commercial original | Commercial | — | quviq.com |
| Concurrency | Concuerror | Systematic testing of concurrent Erlang | MPL-2.0 ? | — | gh:parapluu/Concuerror |
| Coverage | cover* | Built-in coverage (used by rebar3 `--cover`) | Apache-2.0 | — | bundled (OTP) |

### Haskell

| Kind | Tool | For | License | Needs | Published at |
|---|---|---|---|---|---|
| Unit | hspec* / tasty | BDD specs; tasty combines HUnit, QuickCheck, golden providers | MIT | — | hackage:hspec, hackage:tasty |
| Unit | HUnit | xUnit for Haskell | BSD-3-Clause | — | hackage:HUnit |
| Property | QuickCheck* | Original property-based testing | BSD-3-Clause | — | hackage:QuickCheck |
| Property | Hedgehog / falsify | Integrated shrinking | BSD-3-Clause | — | hackage:hedgehog, hackage:falsify |
| Snapshot | tasty-golden / hspec-golden | Golden-file tests | MIT | — | hackage:tasty-golden |
| Doc tests | doctest | Runs examples in Haddock comments | MIT | — | hackage:doctest |
| Coverage | hpc* | GHC's built-in coverage (`--enable-coverage`) | BSD-3-Clause | — | bundled (GHC) |
| Integration | testcontainers | Testcontainers for Haskell | MIT | Docker | hackage:testcontainers |
| Mocking | — | Type classes and records of functions replace mocks | — | — | — |

### OCaml

| Kind | Tool | For | License | Needs | Published at |
|---|---|---|---|---|---|
| Unit | Alcotest* | Simple, colourful unit tests | ISC | — | opam:alcotest |
| Unit | OUnit2 | xUnit for OCaml | MIT | — | opam:ounit2 |
| Snapshot | ppx_expect* / dune cram tests | Expect tests that rewrite expected output; shell-transcript tests | MIT | — | opam:ppx_expect, bundled (dune) |
| Inline | ppx_inline_test | Tests inside source files | MIT | — | opam:ppx_inline_test |
| Property | QCheck* | Property-based testing, Alcotest/OUnit integration | BSD-2-Clause | — | opam:qcheck |
| Coverage | bisect_ppx* | Coverage | MIT | — | opam:bisect_ppx |
| Docs | mdx | Executable code blocks in Markdown | ISC | — | opam:mdx |

### Clojure

| Kind | Tool | For | License | Needs | Published at |
|---|---|---|---|---|---|
| Unit | clojure.test* | Built-in framework | EPL-1.0 | JVM | bundled |
| Runner | Kaocha* | Test runner with plugins, watch mode, focus | EPL-1.0 | JVM | clojars:lambdaisland/kaocha |
| Unit | Midje | Fact-style tests | MIT | JVM | clojars:midje [low activity] |
| Mocking | `with-redefs` / mockfn | Built-in var redefinition; mockfn adds call checks | EPL-1.0 / MIT ? | JVM | bundled, clojars:nubank/mockfn |
| Property | test.check* | QuickCheck for Clojure | EPL-1.0 | JVM | mvn:org.clojure:test.check |
| Coverage | cloverage* | Form-level coverage | EPL-1.0 | JVM | clojars:cloverage |
| Browser | Etaoin | WebDriver client | EPL-1.0 | Browser | clojars:etaoin |
| Integration | clj-test-containers | Testcontainers wrapper | EPL-2.0 ? | Docker | clojars:clj-test-containers |
| ClojureScript | cljs.test + shadow-cljs / Kaocha-cljs2 | Run CLJS tests in Node or browser | EPL-1.0 | — / Browser | npm:shadow-cljs |

### R

| Kind | Tool | For | License | Needs | Published at |
|---|---|---|---|---|---|
| Unit | testthat* | Standard framework, snapshots (`expect_snapshot`), mocking (`local_mocked_bindings`) | MIT | — | cran:testthat |
| Unit | tinytest | Dependency-free alternative | GPL-3.0 | — | cran:tinytest |
| Mocking | mockery | Function stubs | MIT | — | cran:mockery |
| Mocking (HTTP) | httptest2 / webmockr / vcr | Mock or record HTTP | MIT | — | cran:httptest2, cran:webmockr, cran:vcr |
| Snapshot (plots) | vdiffr | SVG snapshots of plots | MIT | — | cran:vdiffr |
| Component / E2E (Shiny) | shinytest2 | Drives Shiny apps via headless Chrome | MIT | Browser | cran:shinytest2 |
| Property | hedgehog / quickcheck | Property-based testing | GPL-3.0 ? | — | cran:hedgehog, cran:quickcheck [low activity ?] |
| Coverage | covr* | Coverage for packages and scripts | MIT | — | cran:covr |

### Julia

| Kind | Tool | For | License | Needs | Published at |
|---|---|---|---|---|---|
| Unit | Test (stdlib)* | `@test`, `@testset` | MIT | — | bundled |
| Runner | TestItemRunner / ReTest | `@testitem` blocks (VS Code integration); filtering | MIT | — | jl:TestItemRunner, jl:ReTest |
| Mocking | Mocking.jl | Patch functions in tests | MIT | — | jl:Mocking |
| Snapshot | ReferenceTests.jl | Compare against stored reference files and images | MIT | — | jl:ReferenceTests |
| Property | Supposition.jl* / PropCheck.jl | Hypothesis-style / shrinking property testing | MIT | — | jl:Supposition, jl:PropCheck |
| Quality | Aqua.jl, JET.jl | Package hygiene and static type-error checks run as tests | MIT | — | jl:Aqua, jl:JET |
| Coverage | `--code-coverage` + Coverage.jl* | Built-in coverage and reports | MIT | — | bundled, jl:Coverage |

### Lua (including Neovim plugins)

| Kind | Tool | For | License | Needs | Published at |
|---|---|---|---|---|---|
| Unit | busted* | BDD framework with luassert mocks and spies | MIT | — | luarocks:busted |
| Unit | LuaUnit | xUnit for Lua | BSD-2-Clause | — | luarocks:luaunit |
| Unit (Neovim) | mini.test / plenary.nvim | Tests inside Neovim child processes | MIT | Neovim | gh:echasnovski/mini.nvim, gh:nvim-lua/plenary.nvim |
| Coverage | LuaCov* | Coverage | MIT | — | luarocks:luacov |

### Perl

| Kind | Tool | For | License | Needs | Published at |
|---|---|---|---|---|---|
| Unit | Test2::V0 / Test2::Suite* | Modern testing toolkit | Artistic-1.0 / GPL-1.0+ | — | cpan:Test2::Suite |
| Unit | Test::More + prove | Classic TAP tests; prove runs them | Artistic-1.0 / GPL-1.0+ | — | bundled (core) |
| Unit | Test::Class | xUnit-style classes | Artistic / GPL | — | cpan:Test::Class |
| Mocking | Test::MockModule / Test::MockObject / Test2::Mock | Module and object mocks | Artistic / GPL | — | cpan:Test::MockModule |
| Web | Test::Mojo | In-process HTTP/WebSocket tests for Mojolicious | Artistic-2.0 | — | cpan:Mojolicious |
| Coverage | Devel::Cover* | Coverage | Artistic / GPL | — | cpan:Devel::Cover |

### Delphi / Object Pascal

| Kind | Tool | For | License | Needs | Published at |
|---|---|---|---|---|---|
| Unit | DUnitX* | Attribute-based xUnit framework | Apache-2.0 | Windows (RAD Studio) | gh:VSoftTechnologies/DUnitX, bundled (RAD Studio) |
| Unit | DUnit | Legacy framework still bundled | MPL-1.1 ? | Windows | bundled |
| Mocking | Delphi-Mocks / Spring4D Mocks | Interface mocking | Apache-2.0 | — | gh:VSoftTechnologies/Delphi-Mocks, Spring4D |
| IDE runner | TestInsight | Runs DUnitX/DUnit tests in the IDE | Freeware ? | Windows | bitbucket:sglienke/testinsight |
| Coverage | DelphiCodeCoverage | Coverage from map/debug info | MPL-2.0 ? | Windows | gh:DelphiCodeCoverage/DelphiCodeCoverage |
| Free Pascal | FPCUnit | Bundled with Free Pascal / Lazarus | LGPL with linking exception | — | bundled |
| GUI | TestComplete / Ranorex | Commercial desktop GUI automation (VCL/FMX) | Commercial | Windows | vendor sites |

### COBOL

| Kind | Tool | For | License | Needs | Published at |
|---|---|---|---|---|---|
| Unit | COBOL Check* | Unit tests for paragraphs/sections as a precompiler; GnuCOBOL and z/OS | Apache-2.0 | JVM | gh:openmainframeproject/cobol-check |
| Unit | IBM zUnit (IBM Developer for z/OS, Test Accelerator for Z) | IBM's unit testing with recorded stubs | Commercial | z/OS | ibm.com |
| Unit | BMC AMI DevX Total Test | Unit and functional testing with data stubs | Commercial | z/OS | bmc.com |
| Unit | Rocket / OpenText (Micro Focus) MFUnit | Unit tests in Visual COBOL / Enterprise Developer ? | Commercial | — | vendor site |
| Integration | Galasa | Integration tests for z/OS (CICS, 3270, batch) | EPL-2.0 | JVM | gh:galasa-dev |

### Fortran

| Kind | Tool | For | License | Needs | Published at |
|---|---|---|---|---|---|
| Unit | pFUnit* | Most feature-rich; MPI and OpenMP tests, CMake | Apache-2.0 ? | — | gh:Goddard-Fortran-Ecosystem/pFUnit |
| Unit | test-drive | Lightweight, used across fortran-lang (fpm) | MIT/Apache-2.0 | — | gh:fortran-lang/test-drive |
| Unit | veggies | Functional-style framework, fpm and CMake | BSD-3-Clause ? | — | gitlab:everythingfunctional/veggies |
| Coverage | gcov / gcovr | via gfortran | GPL / BSD-3-Clause | — | bundled (GCC), pypi:gcovr |

### Ada

| Kind | Tool | For | License | Needs | Published at |
|---|---|---|---|---|---|
| Unit | AUnit* | xUnit for Ada (GNAT) | GPL-3.0 with runtime exception | — | Alire crate `aunit` ?, gh:AdaCore/aunit |
| Unit | GNATtest | Generates AUnit harnesses and skeletons, uses contracts | Commercial (GNAT Pro / GNAT DAS) | — | adacore.com |
| Unit | Ahven | Small framework for Ada 95/2005 compilers | ISC | — | Alire crate `ahven` ? [low activity] |
| Coverage | GNATcoverage | Statement, decision and MC/DC coverage | GPL-3.0 / commercial | — | gh:AdaCore/gnatcoverage |
| Proof | SPARK | Formal verification replacing some tests | GPL-3.0 / commercial | — | Alire crate `gnatprove` |

### Zig

| Kind | Tool | For | License | Needs | Published at |
|---|---|---|---|---|---|
| Unit | `test` blocks + `std.testing` + `zig build test`* | Built-in tests with leak-checking allocator | MIT | — | bundled |
| Coverage | kcov | Coverage of native binaries via DWARF | GPL-2.0 | Linux/macOS | gh:SimonKagstrom/kcov |
| Mocking | — | Use interfaces (vtables) or comptime parameters | — | — | — |

### Nim

| Kind | Tool | For | License | Needs | Published at |
|---|---|---|---|---|---|
| Unit | std/unittest* | Built-in | MIT | — | bundled |
| Unit | unittest2 | Faster, parallel-friendly replacement (Status) | MIT/Apache-2.0 | — | nimble:unittest2 |
| Runner | testament | Compiler's own test runner, usable for projects | MIT | — | bundled |
| Coverage | gcov / kcov via the C backend ? | No Nim-native coverage tool in wide use | — | — | — |

### Crystal

| Kind | Tool | For | License | Needs | Published at |
|---|---|---|---|---|---|
| Unit | Spec* | Built-in RSpec-like framework | Apache-2.0 | — | bundled |
| Unit / mocking | Spectator | RSpec-style framework with mocks and doubles | MIT | — | shard:icy-arctic-fox/spectator |
| Mocking (HTTP) | webmock.cr | HTTP stubbing | MIT | — | shard:manastech/webmock.cr |
| Coverage | kcov | See Zig | GPL-2.0 | Linux/macOS | gh:SimonKagstrom/kcov |

### SQL and data

| Kind | Tool | For | License | Needs | Published at |
|---|---|---|---|---|---|
| Unit (PostgreSQL) | pgTAP* + pg_prove | TAP tests written in SQL | PostgreSQL License | Docker or DB | gh:theory/pgtap, PGXN |
| Unit (SQL Server) | tSQLt* | Unit tests in T-SQL with fake tables and spies | Apache-2.0 | Docker or DB | tsqlt.org |
| Unit (Oracle) | utPLSQL* | PL/SQL unit tests, coverage, CI reporters | Apache-2.0 | Docker or DB | gh:utPLSQL/utPLSQL |
| Unit (MySQL) | MyTAP | pgTAP-style tests for MySQL | Apache-2.0 ? | Docker or DB | gh:hepabolu/mytap [low activity ?] |
| Data models | dbt tests / unit tests | Data and unit tests on dbt models | Apache-2.0 | DB | pypi:dbt-core |
| Data quality | Great Expectations / Soda Core | Expectations on datasets | Apache-2.0 | DB | pypi:great_expectations, pypi:soda-core |
| Lint | SQLFluff | Dialect-aware SQL linter | MIT | — | pypi:sqlfluff |

### Shell (bash, POSIX sh)

| Kind | Tool | For | License | Needs | Published at |
|---|---|---|---|---|---|
| Unit | bats-core* + bats-assert, bats-support, bats-file | TAP-based tests for bash scripts | MIT | bash | gh:bats-core/bats-core, npm:bats |
| Unit | ShellSpec | BDD for POSIX shells (sh, bash, zsh, ksh), mocks, coverage via kcov | MIT | — | gh:shellspec/shellspec |
| Unit | shUnit2 | xUnit for POSIX shells | Apache-2.0 | — | gh:kward/shunit2 |
| Lint | ShellCheck | Static analysis | GPL-3.0 | — | gh:koalaman/shellcheck |
| Coverage | kcov / bashcov | Coverage for bash | GPL-2.0 / MIT | Linux | gh:SimonKagstrom/kcov, gem:bashcov |

### PowerShell

| Kind | Tool | For | License | Needs | Published at |
|---|---|---|---|---|---|
| Unit | Pester* | Tests, mocks, code coverage, NUnit/JUnit output | Apache-2.0 | — | PowerShell Gallery: Pester |
| Lint | PSScriptAnalyzer | Static analysis | MIT | — | PowerShell Gallery: PSScriptAnalyzer |

### Solidity (EVM smart contracts)

| Kind | Tool | For | License | Needs | Published at |
|---|---|---|---|---|---|
| Unit | Foundry (forge)* | Solidity-native tests, fuzzing, invariant tests, coverage, gas snapshots; anvil local node | MIT/Apache-2.0 | — | gh:foundry-rs/foundry (foundryup) |
| Unit | Hardhat | TypeScript tests and, since v3, Solidity tests; local network | MIT | Node | npm:hardhat |
| Symbolic | Halmos | Symbolic testing of Foundry tests (a16z) | AGPL-3.0 ? | — | pypi:halmos |
| Static | Slither | Static analyser | AGPL-3.0 | — | pypi:slither-analyzer |
| Coverage | `forge coverage`* / solidity-coverage | Coverage | MIT | — | bundled (Foundry), npm:solidity-coverage |

### VHDL / Verilog / SystemVerilog

| Kind | Tool | For | License | Needs | Published at |
|---|---|---|---|---|---|
| Testbench | cocotb* | Python coroutine testbenches for any HDL simulator | BSD-3-Clause | Simulator | pypi:cocotb |
| Testbench | pyuvm | UVM in Python on top of cocotb | Apache-2.0 | Simulator | pypi:pyuvm |
| Runner | VUnit* | Unit-test runner for VHDL and SystemVerilog | MPL-2.0 | Simulator | pypi:vunit-hdl |
| Methodology | UVM | Standard SystemVerilog verification library | Apache-2.0 | Commercial simulator usually | accellera.org |
| Methodology (VHDL) | OSVVM / UVVM | VHDL verification libraries | Apache-2.0 | Simulator | gh:OSVVM/OSVVM, gh:UVVM/UVVM |
| Unit (SV) | SVUnit | Unit tests for SystemVerilog | Apache-2.0 | Simulator | gh:svunit/svunit |
| Simulators | Verilator, GHDL, Icarus Verilog | Open-source simulators the tools above drive | LGPL-3.0 / GPL-2.0 / GPL-2.0 | — | verilator.org, gh:ghdl/ghdl, gh:steveicarus/iverilog |
| Formal | SymbiYosys | Formal property checking | ISC | — | gh:YosysHQ/sby |

### Game engines

| Kind | Tool | For | License | Needs | Published at |
|---|---|---|---|---|---|
| Unity unit / play mode | Unity Test Framework* | NUnit-based Edit Mode and Play Mode tests | Unity Companion License | Unity Editor | upm:com.unity.test-framework |
| Unity performance | Performance Testing Extension | Measures frame times and allocations in tests | Unity Companion License | Unity Editor | upm:com.unity.test-framework.performance |
| Unity coverage | Code Coverage package | Coverage for Unity tests | Unity Companion License | Unity Editor | upm:com.unity.testtools.codecoverage |
| Unity / Unreal E2E | AltTester | Drives game UI from external tests (C#, Python, Java, Robot); older SDKs GPL-3.0, newer non-GPL SDK needs an account and key | GPL-3.0 (older) / commercial | Built game | alttester.com |
| Unity / Unreal E2E | GameDriver | Commercial game test automation | Commercial | Built game | gamedriver.io |
| Unreal | Automation Test Framework, Automation Spec (BDD), CQTest (fixtures)* | In-engine C++ tests | Unreal EULA | Unreal Editor | bundled (engine) |
| Unreal | Low-Level Tests | Catch2-based tests for modules without the engine | Unreal EULA | — | bundled |
| Unreal | Functional Tests, Automation Driver | Map-based gameplay tests; UI input simulation | Unreal EULA | Unreal Editor | bundled |
| Unreal | Gauntlet | Runs packaged builds on devices, clients and servers and validates sessions | Unreal EULA | Built game | bundled |
| Godot | GUT* | GDScript unit testing, broad Godot 4 coverage | MIT | Godot | Godot Asset Library, gh:bitwes/Gut |
| Godot | GdUnit4 | GDScript and C# tests with mocks, scene runner, fuzzing | MIT | Godot | Godot Asset Library, gh:MikeSchulze/gdUnit4 |

---

## Part B — Kinds that cut across stacks

### Integration testing support

| Tool | For | License | Needs | Published at |
|---|---|---|---|---|
| Testcontainers | Throwaway real dependencies (databases, brokers, cloud emulators) started from test code. Implementations: Java, Go, .NET, Node.js, Python, Rust, Ruby, PHP, Elixir, Haskell, Clojure (community), Scala wrapper; Kotlin uses Java. No implementation for Swift, Dart, C/C++, Erlang, OCaml, R, Julia, Lua, Perl, Delphi ? | MIT (most), Apache-2.0 (Python) | Docker | testcontainers.com/modules; mvn:org.testcontainers, go:github.com/testcontainers/testcontainers-go, nuget:Testcontainers, npm:testcontainers, pypi:testcontainers, crates:testcontainers, gem:testcontainers, packagist:testcontainers/testcontainers, hex:testcontainers, hackage:testcontainers |
| Docker Compose | Language-neutral way to start dependencies for any stack | Apache-2.0 | Docker | docker.com |
| dockertest | Go alternative to Testcontainers | Apache-2.0 | Docker | go:github.com/ory/dockertest/v3 |
| Aspire testing | .NET: starts the whole distributed app model in tests | MIT | Docker | nuget:Aspire.Hosting.Testing |
| In-memory: SQLite | Real SQL engine in memory; dialect differs from production databases | Public domain | — | bundled with most stacks |
| In-memory: H2 / HSQLDB | JVM in-memory databases; dialect gaps, prefer Testcontainers for production parity | MPL-2.0/EPL-1.0 / BSD | JVM | mvn:com.h2database:h2 |
| In-memory: EF Core InMemory | Fake provider; Microsoft advises against it for testing database behaviour — use SQLite in-memory or a container | MIT | — | nuget:Microsoft.EntityFrameworkCore.InMemory |
| In-memory: mongodb-memory-server / pg-mem | Node: real mongod binary in a temp dir / pure-JS Postgres emulation | MIT | — | npm:mongodb-memory-server, npm:pg-mem |
| In-memory: miniredis / fakeredis | Redis fakes for Go / Python | MIT / BSD-3-Clause | — | go:github.com/alicebob/miniredis/v2, pypi:fakeredis |
| Embedded Kafka | Spring Kafka in-JVM broker | Apache-2.0 | JVM | mvn:org.springframework.kafka:spring-kafka-test |
| WireMock / MockServer / Microcks / Prism | Stub external HTTP APIs (Microcks and Prism generate stubs from OpenAPI/AsyncAPI) | Apache-2.0 | JVM or Docker | docker:wiremock/wiremock, docker:quay.io/microcks/microcks-uber, npm:@stoplight/prism-cli |
| Mailpit | Fake SMTP server with API for asserting emails | MIT | Docker or binary | gh:axllent/mailpit |
| stripe-mock | Mock of the Stripe API | MIT | Docker or binary | gh:stripe/stripe-mock |

### End-to-end — web

| Tool | For | License | Needs | Published at |
|---|---|---|---|---|
| Playwright* | Chromium, Firefox and WebKit; JS/TS, Python, Java, .NET bindings; traces, screenshots, API testing | Apache-2.0 | Browser | npm:@playwright/test, pypi:pytest-playwright, mvn:com.microsoft.playwright:playwright, nuget:Microsoft.Playwright |
| Cypress | In-browser runner with time-travel debugging; JS/TS only; Cypress Cloud is paid | MIT (app) | Browser | npm:cypress |
| Selenium WebDriver | W3C WebDriver; most languages; Selenium Grid for scale | Apache-2.0 | Browser | selenium.dev/downloads (per-language packages) |
| WebdriverIO | WebDriver and WebDriver BiDi; web, mobile (Appium), Electron, Tauri | MIT | Browser | npm:webdriverio, npm:@wdio/cli |
| Nightwatch | WebDriver-based runner | MIT | Browser | npm:nightwatch |
| Puppeteer | Chrome/Firefox automation library (not a test runner) | Apache-2.0 | Browser | npm:puppeteer |
| TestCafe | No-WebDriver runner | MIT | Browser | npm:testcafe [low activity ?] |
| CodeceptJS / Serenity/JS | Scenario-style layers over Playwright/WebDriver | MIT / Apache-2.0 | Browser | npm:codeceptjs, npm:@serenity-js/core |
| Robot Framework Browser | Keyword-driven tests on Playwright | Apache-2.0 | Browser | pypi:robotframework-browser |
| Stack-native | Capybara (Ruby), Laravel Dusk / Symfony Panther (PHP), Selenide (Java), Wallaby (Elixir), Etaoin (Clojure) | see Part A | Browser | see Part A |

### End-to-end — mobile

| Tool | For | License | Needs | Published at |
|---|---|---|---|---|
| Appium* | Cross-platform WebDriver for native, hybrid and mobile web; drivers: UiAutomator2, Espresso, XCUITest, Flutter, Mac2, Windows | Apache-2.0 | Emulator | npm:appium (drivers via `appium driver install`) |
| Espresso / UI Automator / Compose UI test | Android in-process and system UI tests | Apache-2.0 | Emulator | Google Maven (androidx.test) |
| XCUITest | iOS/macOS UI tests from Xcode | Apple | macOS, Emulator | bundled (Xcode) |
| Maestro | YAML flows for Android, iOS, React Native, Flutter, web; Maestro Cloud is paid | Apache-2.0 ? | Emulator | gh:mobile-dev-inc/maestro |
| Detox | Gray-box E2E for React Native (Wix), New Architecture supported | MIT | Emulator | npm:detox |
| Flutter integration_test / Patrol | Flutter on device; Patrol adds native interactions | BSD-3-Clause / Apache-2.0 | Emulator | bundled, pub:patrol |
| Kaspresso | Kotlin DSL over Espresso and UI Automator | Apache-2.0 | Emulator | mvn:com.kaspersky.android-components:kaspresso |
| EarlGrey 2 | iOS white-box UI tests | Apache-2.0 | macOS, Emulator | gh:google/EarlGrey [low activity ?] |

### End-to-end — desktop

| Tool | For | License | Needs | Published at |
|---|---|---|---|---|
| FlaUI* | .NET UI Automation (UIA2/UIA3) wrapper for Win32, WinForms, WPF, UWP | MIT | Windows | nuget:FlaUI.UIA3 |
| NovaWindows Driver (Appium) | Appium driver for Windows apps; replacement for WinAppDriver recommended by the Appium Windows driver README; PowerShell back end, early stage | Apache-2.0 ? | Windows | npm:appium-novawindows-driver |
| Appium Windows Driver | Appium proxy in front of WinAppDriver (unmaintained server) | Apache-2.0 | Windows | npm:appium-windows-driver |
| pywinauto | Python Windows GUI automation | BSD-3-Clause | Windows | pypi:pywinauto [low activity ?] |
| Accessibility Insights for Windows | UIA inspection and automated a11y checks | MIT | Windows | gh:microsoft/accessibility-insights-windows |
| Appium Mac2 Driver | macOS apps via XCTest | Apache-2.0 | macOS | npm:appium-mac2-driver |
| Playwright for Electron | Launches Electron apps (`_electron`), experimental | Apache-2.0 | — | npm:playwright |
| WebdriverIO Electron service | Electron tests with main-process API access and mocking | MIT | — | npm:wdio-electron-service |
| tauri-driver / WebdriverIO Tauri | WebDriver for Tauri apps; native tauri-driver covers Windows and Linux; macOS via WebdriverIO's embedded provider or CrabNebula's fork ? | Apache-2.0/MIT | — | crates:tauri-driver |
| Avalonia.Headless | Headless UI tests for Avalonia | MIT | — | nuget:Avalonia.Headless.XUnit |
| Qt Test / Squish | Qt widgets and QML; Squish is commercial and covers Qt, Java, Windows, macOS | LGPL / commercial | — | bundled (Qt), qt.io |
| TestComplete / Ranorex | Commercial record-and-script desktop automation | Commercial | Windows | vendor sites |
| Robot Framework + libraries | Keyword-driven; FlaUILibrary, SikuliLibrary | Apache-2.0 | varies | pypi:robotframework |

### End-to-end — API (REST, GraphQL, gRPC)

| Tool | For | License | Needs | Published at |
|---|---|---|---|---|
| Stack HTTP client + runner* | supertest, REST Assured, WebApplicationFactory, httpx + pytest, `httptest` | see Part A | — | see Part A |
| REST Assured | Java DSL for HTTP API tests | Apache-2.0 | JVM | mvn:io.rest-assured:rest-assured |
| Karate | Gherkin-style API, mocks, performance (via Gatling) | MIT | JVM | mvn:io.karatelabs:karate-junit5 |
| Playwright API testing | `request` fixture alongside browser tests | Apache-2.0 | — | npm:@playwright/test |
| Hurl | Plain-text HTTP request files with assertions; CLI | Apache-2.0 | — | gh:Orange-OpenSource/hurl |
| Bruno CLI | Git-friendly API collections run in CI | MIT | — | npm:@usebruno/cli |
| Postman + Newman | Collections run from CLI; Postman app is proprietary | Apache-2.0 (Newman) | — | npm:newman |
| Keploy | Records traffic and replays it as tests and mocks | Apache-2.0 | Linux (eBPF) or Docker | gh:keploy/keploy |
| Venom | YAML test suites for HTTP, gRPC, databases (OVHcloud) | Apache-2.0 | — | gh:ovh/venom |
| Tavern | YAML API tests as a pytest plugin | MIT | — | pypi:tavern |
| grpcurl | CLI for calling gRPC services in scripts | MIT | — | gh:fullstorydev/grpcurl |
| ghz | gRPC load and benchmark tool | Apache-2.0 | — | gh:bojand/ghz |
| Step CI | YAML API tests (REST, GraphQL, gRPC) | MPL-2.0 ? | — | npm:stepci [low activity ?] |

### End-to-end — CLI

| Tool | For | License | Needs | Published at |
|---|---|---|---|---|
| bats-core / ShellSpec | Any CLI driven from shell scripts | MIT | bash / POSIX sh | see Part A (Shell) |
| testscript | Go: txtar scripts with expected stdout/stderr | BSD-3-Clause | — | go:github.com/rogpeppe/go-internal/testscript |
| trycmd / snapbox / assert_cmd | Rust: file-based CLI cases and assertions | MIT/Apache-2.0 | — | crates:trycmd |
| Aruba | Ruby: CLI testing with RSpec/Cucumber | MIT | — | gem:aruba |
| pytest + subprocess / pexpect | Python: run commands, drive interactive prompts | MIT / ISC | — | pypi:pexpect |
| prysk | Cram-style shell transcripts (fork of cram) | GPL-2.0 ? | — | pypi:prysk |
| dune cram tests | OCaml: shell transcripts in the build | MIT | — | bundled (dune) |
| Pester | PowerShell commands and scripts | Apache-2.0 | — | PowerShell Gallery |

### Snapshot / approval testing (summary)

Stack-specific tools are in Part A. Typical choice per stack: Vitest/Jest snapshots (JS), Verify (.NET), ApprovalTests (Java, C++, Python and more — approvaltests.com lists ports), Selfie (JVM, JS, Python ?), syrupy or inline-snapshot (Python), insta (Rust), go-snaps (Go), spatie snapshots (PHP), swift-snapshot-testing (Swift), Paparazzi or Roborazzi (Android), Flutter goldens with Alchemist, ppx_expect (OCaml), tasty-golden (Haskell), testthat `expect_snapshot` and vdiffr (R), ReferenceTests.jl (Julia), Mneme (Elixir), `forge snapshot` for gas (Solidity).

### Visual regression

| Tool | For | License | Needs | Published at |
|---|---|---|---|---|
| Playwright `toHaveScreenshot`* | Pixel comparison in Playwright tests; run in a fixed Docker image so fonts match | Apache-2.0 | Browser, Docker recommended | npm:@playwright/test |
| Vitest `toMatchScreenshot` | Screenshot assertions in Vitest browser mode | MIT | Browser | npm:vitest |
| Storybook + Chromatic | Snapshots every story in cloud browsers, review UI; free tier and OSS plan | Commercial | SaaS, Account | npm:chromatic |
| Percy (BrowserStack) | Cloud visual review from Playwright, Cypress, Selenium, Storybook, mobile | Commercial (SDKs MIT) | SaaS, Account | npm:@percy/cli |
| Argos | Visual review service with Playwright, Cypress, Storybook SDKs; self-hosting not supported ? | MIT (code) / SaaS | SaaS, Account | npm:@argos-ci/cli |
| Applitools Eyes | AI-based visual comparison | Commercial | SaaS, Account | applitools.com |
| BackstopJS | Self-hosted, config-driven page screenshots with Puppeteer/Playwright; no active feature development | MIT | Browser, Docker optional | npm:backstopjs [low activity] |
| Loki | Storybook screenshots in Docker Chrome, iOS simulator or Android emulator | MIT | Docker or Emulator | npm:loki [low activity] |
| reg-suit | Compares screenshot folders and publishes reports to S3/GCS | MIT | — | npm:reg-suit [low activity ?] |
| Native screenshots | Paparazzi/Roborazzi (Android), swift-snapshot-testing (iOS), Flutter goldens, Verify.ImageMagick (.NET) | see Part A | see Part A | see Part A |

### Contract testing

| Tool | For | License | Needs | Published at |
|---|---|---|---|---|
| Pact* | Consumer-driven contracts for HTTP and messages; JS, JVM, .NET, Python, Go, Rust, PHP, Ruby, Swift ? | MIT (JVM: Apache-2.0) | — | npm:@pact-foundation/pact, mvn:au.com.dius.pact, nuget:PactNet, pypi:pact-python, go:github.com/pact-foundation/pact-go/v2, packagist:pact-foundation/pact-php, gem:pact |
| Pact Broker / PactFlow | Shares contracts and verification results; `can-i-deploy` | MIT / commercial | Docker or SaaS | docker:pactfoundation/pact-broker |
| Spring Cloud Contract | Producer-driven contracts for Spring (HTTP, messaging), generates stubs | Apache-2.0 | JVM | mvn:org.springframework.cloud:spring-cloud-contract-verifier |
| Specmatic | Turns OpenAPI (and more) specs into contract tests and mocks; open-source core covers OpenAPI and SOAP, AsyncAPI/GraphQL/gRPC are enterprise features ? | MIT (core) ? / commercial | JVM or Docker | gh:specmatic/specmatic, docker:specmatic/specmatic |
| Microcks | Mocks and conformance tests from OpenAPI, AsyncAPI, gRPC, GraphQL (CNCF) | Apache-2.0 | Docker | gh:microcks/microcks |

### Performance and load

| Tool | For | License | Needs | Published at |
|---|---|---|---|---|
| k6* | JS-scripted load tests, thresholds for CI, browser module | AGPL-3.0 | — | gh:grafana/k6, docker:grafana/k6 |
| Gatling | Load tests in Java, Kotlin, Scala or JS/TS DSL; HTML reports | Apache-2.0 | JVM (or Node for JS) | mvn:io.gatling.highcharts:gatling-charts-highcharts, npm:@gatling.io/cli |
| Apache JMeter | GUI-built test plans, many protocols | Apache-2.0 | JVM | jmeter.apache.org |
| Locust | Python-scripted user behaviour, distributed | MIT | — | pypi:locust |
| Artillery | YAML/JS scenarios, Playwright-based browser load | MPL-2.0 | — | npm:artillery |
| NBomber | .NET load tests in C#/F#; free only for personal and academic use, organisations need a subscription | Commercial | — | nuget:NBomber |
| vegeta | Constant-rate HTTP load, Go library and CLI | MIT | — | gh:tsenart/vegeta |
| oha | Quick HTTP load generator with TUI | MIT | — | crates:oha |
| Goose | Rust load-testing framework | Apache-2.0 | — | crates:goose |
| ghz | gRPC load | Apache-2.0 | — | gh:bojand/ghz |
| Taurus | YAML wrapper running JMeter, Gatling, Locust and others | Apache-2.0 | JVM / Python | pypi:bzt [low activity ?] |
| Micro-benchmarks | JMH, BenchmarkDotNet, pytest-benchmark, Go `testing.B`, criterion, Google Benchmark | see Part A; BenchmarkDotNet MIT | — | nuget:BenchmarkDotNet |

### Accessibility

| Tool | For | License | Needs | Published at |
|---|---|---|---|---|
| axe-core* | Rule engine behind most automated a11y checks | MPL-2.0 | Browser or jsdom | npm:axe-core |
| axe bindings | @axe-core/playwright, @axe-core/webdriverio, cypress-axe, jest-axe, axe-core-maven-html (Java), Deque.AxeCore.Playwright / .Selenium (.NET), axe-core-gems (Ruby), Storybook a11y addon | MPL-2.0 (Deque packages), MIT (community) | Browser | npm:@axe-core/playwright, npm:cypress-axe, npm:jest-axe, mvn:com.deque.html.axe-core, nuget:Deque.AxeCore.Playwright, gem:axe-core-rspec, npm:@storybook/addon-a11y |
| Pa11y / pa11y-ci | CLI and CI runner over URLs (axe or HTML_CodeSniffer) | LGPL-3.0 | Browser | npm:pa11y, npm:pa11y-ci |
| Lighthouse / Lighthouse CI | Accessibility, performance and SEO audits with budgets | Apache-2.0 | Browser | npm:lighthouse, npm:@lhci/cli |
| IBM Equal Access Checker | Alternative rule engine with Playwright/Puppeteer/Selenium integrations | Apache-2.0 | Browser | npm:accessibility-checker |
| Native | Android ATF, Compose semantics checks; XCUITest `performAccessibilityAudit`, GTXiLib; Flutter `meetsGuideline`; Accessibility Insights (Windows, Android, web) | Apache-2.0 / Apple / BSD-3-Clause / MIT | Emulator or OS | see Part A |

### DAST (dynamic application security testing)

| Tool | For | License | Needs | Published at |
|---|---|---|---|---|
| ZAP (by Checkmarx)* | Baseline, full and API scans; GitHub Actions and Docker images; no longer an OWASP project | Apache-2.0 | Docker or JVM | gh:zaproxy/zaproxy, docker:zaproxy/zap-stable |
| Nuclei | Template-based scanner (ProjectDiscovery), large community templates | MIT | — | gh:projectdiscovery/nuclei |
| Burp Suite / Dastardly | Commercial scanner; Dastardly is its free CI scanner | Commercial / free proprietary | Docker | portswigger.net |
| Nikto | Web server misconfiguration scanner | GPL-2.0 ? | — | gh:sullo/nikto |
| Wapiti | Black-box web vulnerability scanner | GPL-2.0 | — | pypi:wapiti3 |
| StackHawk | Commercial CI-focused DAST built on ZAP | Commercial | SaaS, Docker | stackhawk.com |

### Property-based testing (summary)

Per-stack choices are in Part A: fast-check (JS), jqwik (Java), Kotest property (Kotlin), FsCheck / CsCheck (.NET), Hypothesis (Python), rapid (Go), proptest (Rust), Eris (PHP), prop_check (Ruby), SwiftCheck (Swift, low activity), glados (Dart), RapidCheck (C++), theft (C), ScalaCheck (Scala), StreamData (Elixir), PropEr (Erlang), QuickCheck / Hedgehog / falsify (Haskell), QCheck (OCaml), test.check (Clojure), hedgehog (R), Supposition.jl (Julia).

### Coverage (summary)

Built into the toolchain: Go, Rust (via LLVM), Swift/Xcode, Elixir, Erlang, Haskell (hpc), Julia, Zig/Crystal/Nim (via kcov or gcov), Foundry, Pester. Separate tool: V8/Istanbul (JS), JaCoCo / Kover (JVM), coverlet (.NET), coverage.py (Python), PCOV/Xdebug (PHP), SimpleCov (Ruby), gcov/llvm-cov + gcovr (C/C++/Fortran), scoverage (Scala), bisect_ppx (OCaml), cloverage (Clojure), covr (R), LuaCov, Devel::Cover (Perl), DelphiCodeCoverage, GNATcoverage (Ada), utPLSQL (Oracle), kcov/bashcov (shell), Unity Code Coverage package. Hosted dashboards: Codecov, Coveralls (both SaaS, free for public repositories).

### Affected-test selection

| Tool | For | License | Needs | Published at |
|---|---|---|---|---|
| Nx affected* | JS/TS (and plugins for JVM, .NET, Go) monorepos: runs tasks of projects changed since a base commit | MIT | — | npm:nx |
| Turborepo | JS/TS monorepos: `--filter=...[base]` and caching | MIT | — | npm:turbo |
| Vitest `--changed` / Jest `--changedSince` | Tests related to changed files by import graph | MIT | — | with runner |
| Bazel / Pants / Buck2 | Polyglot builds that rerun only tests whose inputs changed, with remote cache | Apache-2.0 / Apache-2.0 / MIT/Apache-2.0 | — | bazel.build, pantsbuild.org, gh:facebook/buck2 |
| Gradle build cache + Develocity Predictive Test Selection | Gradle up-to-date checks free; predictive selection is commercial | Apache-2.0 / commercial | Account (Develocity) | gradle.com |
| pytest-testmon | Python: reruns tests affected by changed code using coverage data | MIT ? | — | pypi:pytest-testmon |
| `mix test --stale` | Elixir | Apache-2.0 | — | bundled |
| Go test cache | `go test ./...` skips packages whose inputs did not change | BSD-3-Clause | — | bundled |
| dotnet-affected | .NET: projects affected by changed files in a solution | MIT ? | — | nuget:dotnet-affected |
| CloudBees Smart Tests (formerly Launchable) / Datadog Test Impact Analysis | ML or coverage-based test selection, any stack | Commercial | SaaS, Account | cloudbees.com, datadoghq.com |

### Cloud service emulators

| Tool | For | License | Needs | Published at |
|---|---|---|---|---|
| LocalStack | AWS emulator; since March 2026 the single `localstack/localstack` image needs an auth token (free Hobby plan reported as non-commercial only ?) | Commercial / free tier | Docker, Account | docker:localstack/localstack |
| Floci | Young MIT-licensed AWS emulator presented as a LocalStack replacement on port 4566; some services need Docker; maturity unproven | MIT | Docker | gh:hectorvent/floci |
| moto | Python library and standalone server mocking AWS APIs | Apache-2.0 | — (Docker optional) | pypi:moto, docker:motoserver/moto |
| DynamoDB Local | Official local DynamoDB | AWS license (free) | Docker or JVM | docker:amazon/dynamodb-local |
| AWS SAM CLI | Runs Lambda and API Gateway locally | Apache-2.0 | Docker | gh:aws/aws-sam-cli |
| Azurite* (Azure) | Blob, Queue and Table storage emulator | MIT | Docker or Node | npm:azurite, docker:mcr.microsoft.com/azure-storage/azurite |
| Azure Cosmos DB emulator (vNext, Linux) | NoSQL API emulator, GA since June 2026, x64 and ARM64; feature coverage partial | Microsoft license (free) | Docker | docker:mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator:vnext-latest |
| Azure Service Bus / Event Hubs emulators | Local messaging emulators; Service Bus emulator was documented with Azure SQL Edge, which retired on 2025-09-30 — check current Microsoft guidance for its database dependency ? | Microsoft license (free) | Docker | docker:mcr.microsoft.com/azure-messaging/servicebus-emulator |
| Azure Functions Core Tools | Runs Functions locally | MIT | Node/.NET | npm:azure-functions-core-tools |
| Firebase Local Emulator Suite* (Firebase) | Auth, Firestore, Realtime DB, Functions, Storage, Hosting, Pub/Sub | MIT (firebase-tools) | JVM, Node | npm:firebase-tools |
| Google Cloud emulators | Pub/Sub, Datastore/Firestore, Bigtable, Spanner via `gcloud emulators` | Google (free); Spanner emulator Apache-2.0 | JVM or Docker | cloud.google.com/sdk, gh:GoogleCloudPlatform/cloud-spanner-emulator |
| fake-gcs-server | Google Cloud Storage emulator | BSD-2-Clause | Docker | docker:fsouza/fake-gcs-server |
| Supabase CLI | Full local Supabase stack | MIT | Docker | npm:supabase |
| S3-compatible storage | MinIO's open-source project is in maintenance/unmaintained state and stopped publishing free images; use Garage, SeaweedFS, cloud emulators above, or a pinned self-built MinIO image | Garage AGPL-3.0, SeaweedFS Apache-2.0 | Docker | docker:dxflrs/garage, docker:chrislusf/seaweedfs |
| Aspire | .NET orchestration that starts emulators (Azurite, Cosmos, Service Bus) as containers | MIT | Docker | nuget:Aspire.Hosting |

### Device emulators and device clouds

| Tool | For | License | Needs | Published at |
|---|---|---|---|---|
| Android Emulator + Gradle Managed Devices* | Android phones, tablets, Wear OS, TV, Automotive images; Gradle can create headless devices for CI | Android SDK License | KVM/HVF/WHPX hardware acceleration | Android SDK Manager (`sdkmanager`) |
| docker-android | Android emulator inside Docker for CI | Apache-2.0 ? | Docker, KVM (Linux) | gh:budtmo/docker-android |
| iOS / watchOS / tvOS / visionOS Simulator* | Apple platform simulators | Apple (Xcode) | macOS | bundled (Xcode, `xcrun simctl`) |
| Genymotion | Commercial Android emulators, desktop and cloud | Commercial | — / SaaS | genymotion.com |
| Corellium | Virtualised iOS and Android devices (security research, CI) | Commercial | SaaS | corellium.com |
| Firebase Test Lab / AWS Device Farm | Real and virtual devices in the cloud | Commercial (pay per use) | SaaS, Account | firebase.google.com, aws.amazon.com |
| BrowserStack / Sauce Labs / LambdaTest | Real devices and browsers in the cloud for Appium, Espresso, XCUITest, Playwright, Selenium | Commercial | SaaS, Account | vendor sites |
| QEMU | CPU and board emulation for embedded and cross-architecture tests | GPL-2.0 | — | qemu.org |
| Renode | Simulates MCUs, boards and peripherals; runs firmware with Robot Framework tests | MIT | — | gh:renode/renode |
| Wokwi | Microcontroller simulator with CI runner | Commercial (free tier) | SaaS | wokwi.com |
| Windows Sandbox / Hyper-V VMs | Clean Windows environments for desktop E2E | Windows license | Windows | bundled (Windows Pro/Enterprise) |

---

## Part C — Dead or replaced (do not propose)

| Tool | Status | Use instead |
|---|---|---|
| Karma | Deprecated since 2023, no new features or general fixes | Vitest (Angular CLI default), Web Test Runner |
| Protractor | End of life (Angular team, 2023) | Playwright, Cypress, WebdriverIO |
| Enzyme | No React 18+ adapter, effectively unmaintained | React Testing Library |
| Spectron | Deprecated and archived (Electron, 2022) | Playwright for Electron, wdio-electron-service |
| Lost Pixel | Sunset April 2026 (team joined Figma), repository archived | Playwright screenshots, Argos, Chromatic, Percy |
| WinAppDriver | Last release 2020, unmaintained by Microsoft | FlaUI, NovaWindows driver |
| TestStack.White | Unmaintained | FlaUI |
| Xamarin.UITest / App Center Test | Xamarin support ended 2024; App Center retired 2025-03-31 | Appium, device clouds |
| SpecFlow | End of life 2024-12-31 (Tricentis) | Reqnroll |
| golang/mock | Archived by the Go team | go.uber.org/mock |
| golden_toolkit (Flutter) | Discontinued on pub.dev | Alchemist, built-in goldens |
| Truffle / Ganache | Sunset by Consensys (2023), archived | Foundry, Hardhat |
| Dredd | Archived 2024-11-08 | Specmatic, Pact |
| mountebank (original) | No longer maintained since 2024; community forks exist | WireMock, Microcks, MockServer |
| Expecta, Kiwi (Objective-C) | Expecta archived; Kiwi inactive ? | XCTest, OCMock, Nimble |
| EarlGrey 1 | Deprecated by Google | EarlGrey 2 or XCUITest |
| FRUIT (Fortran) | Not maintained | pFUnit, test-drive, veggies |
| Azure SQL Edge | Retired 2025-09-30 | SQL Server Linux container |
| LocalStack Community (free, no account) | Replaced in March 2026 by an image that needs an auth token | LocalStack with account, moto, Floci |
| MinIO free images | Stopped October 2025; project in maintenance/unmaintained state | Garage, SeaweedFS, cloud emulators |
| w3af, Arachni | Unmaintained web scanners | ZAP, Nuclei |
| FluentAssertions v8+ (for free commercial use) | Not dead, but commercial licence since v8 | AwesomeAssertions, Shouldly, v7 |
| NBomber (for free use in organisations) | Not dead, but commercial for organisations | k6, Gatling, Locust |

---

## Part D — Finding test tools for a stack not listed

### Method

1. **Read the stack's official docs first.** Search `"<language or framework> testing"` on the official site. Most languages ship a framework (Go, Rust, Zig, Elixir, Julia, Crystal, Nim) or name one in their guide; frameworks often document their test harness (Angular TestBed, Phoenix, Unreal Automation). This is the default unless there is a reason to move away.
2. **Look in the official package registry.** Search the registry (npm, PyPI, crates.io, Hex, pub.dev, CRAN, LuaRocks, Alire, opam, Clojars, NuGet, Maven Central, Packagist, RubyGems, PowerShell Gallery, Unity/Godot asset stores) for `test`, `mock`, `property`, `quickcheck`, `snapshot`, `golden`, `coverage`. Sort by downloads or dependents, not by stars.
3. **Check the language's curated lists.** "awesome-<language>" lists, the language's package index categories (e.g. Hackage "Testing", Julia "Testing" topic, fortran-lang package index), and the language forum's pinned threads. Use them for names only, then verify each name.
4. **Ask what the language's big projects use.** Open the repositories of the compiler, standard library and two or three popular packages, and read their test folders and CI files. Tools used there are the safest choices.
5. **Map the cross-stack kinds.** Most of Part B is language-neutral: end-to-end (Playwright, Appium, bats), API (Hurl), contract (Pact if a binding exists, otherwise Specmatic or Microcks against the spec), load (k6, Gatling, Locust), accessibility (axe-core), DAST (ZAP), emulators (Testcontainers or Docker Compose). Only unit, mocking, snapshot, property and coverage need a language-specific tool.
6. **Check the generic fallbacks** when no native tool exists: coverage via gcov/llvm-cov/kcov for anything compiled to native code; snapshot testing by writing output to files and diffing them in the test; property testing via a small hand-written generator loop.
7. **Apply the liveness checks below** to every candidate, then propose the best one or two to the user in plain language with their trade-offs. Mark anything you could not verify.

### Judging whether a tool is alive

| Signal | Alive | Warning | Dead |
|---|---|---|---|
| Repository state | Not archived | Owner asks for new maintainers | Archived / read-only, or README says "no longer maintained", "deprecated", "sunset" |
| Last release in the official registry | Within about 12 months | 1–2 years | Over 2 years, or marked discontinued (pub.dev, npm `deprecated`) |
| Compatibility | Supports the current major version of the language/framework/runtime | Only the previous major | Fails on the current major (e.g. no adapter for the current React) |
| Commits on the default branch | Several in the last 6 months by more than one person | Only dependency bot commits | None for a year |
| Issues and pull requests | Maintainers answer within weeks | Long-open bug reports on core features | Issues disabled or ignored |
| Ownership and licence | Clear owner or foundation; OSI licence stable | Recently acquired; new licence key or account requirement | Licence switched to commercial with free edition withdrawn |
| Adoption | Used by the language's major projects; growing dependents in the registry | Downloads declining | Big users migrated away, migration guides exist |

Read the registry page and the repository itself. Third-party comparison pages often lag by a year or more and vendor blogs about competitors are biased. A tool with low activity is acceptable when it is small and finished (for example a single-header C framework) and works on the current toolchain; say so when proposing it.
