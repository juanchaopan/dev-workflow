# Spring Boot (Java)

## How to recognize it

The component's `pom.xml` inherits from `spring-boot-starter-parent`, or its `build.gradle(.kts)` applies the `org.springframework.boot` plugin.

## Required tools

- A JDK of the version chosen in the decision points (`java --version`). Maven and Gradle need no separate installation: the project carries its wrapper (`mvnw` or `gradlew`).
- curl and unzip (both in Git Bash; `tar -xf` also extracts zip files).

## Decision points

/architect asks each of these once this stack is chosen. The recommended option is what this document does; for another option, configure the equivalent from the tool's official documentation and keep the self-check commands, hook rules and CI consistent.

| Decision | Options | Recommended |
|---|---|---|
| Build tool | Maven / Gradle (Kotlin DSL) / Gradle (Groovy DSL) | Maven: straightforward configuration and the most documentation; Gradle (Kotlin DSL) for complex build logic or many modules |
| Java version | The current LTS / the previous LTS | The current LTS, when the team and the deployment environment support it |
| Data access | Spring Data JPA / MyBatis / jOOQ / Spring JDBC | JPA; MyBatis or jOOQ for complex SQL that needs fine control |
| Database migrations | Flyway / Liquibase | Flyway: plain SQL scripts, simple |
| API style | REST / GraphQL / gRPC | REST |
| Authentication | OAuth2 resource server (tokens) / session with form login / none | OAuth2 resource server for a separate frontend |
| Test database | Testcontainers / H2 in memory | Testcontainers: the same database as production |
| Lombok | No / yes | No: records and the IDE cover most boilerplate, and it is one less compile-time trick |

## Versions

The current Java LTS comes from `node <scaffold skill directory>/shared/versions.mjs lts eclipse-temurin`. Spring Initializr's defaults give the latest Spring Boot. When Spring Initializr does not offer the current LTS as `javaVersion` yet, tell the user and let them choose between the previous LTS and waiting. Plugin and library versions come from Maven Central (step 1 of "After creating").

## Create

Generate with Spring Initializr. `type` follows the build tool: `maven-project`, `gradle-project-kotlin` or `gradle-project`. Dependencies follow the architecture documents; list the available dependency IDs with `curl -s https://start.spring.io/dependencies`.

```
curl -fsSL https://start.spring.io/starter.zip \
  -d type=<maven-project or gradle-project-kotlin> -d language=java -d javaVersion=<Java version> \
  -d groupId=<the organization's reversed domain, e.g. com.example> -d artifactId=<name> -d name=<name> \
  -d packageName=<root package> -d dependencies=<dependency IDs, comma-separated> \
  -o <name>.zip
mkdir -p <directory> && unzip -q <name>.zip -d <directory> && rm <name>.zip
```

After extracting, make sure `pom.xml` or `build.gradle.kts` is at the root of the component directory; if not, move the contents of the inner directory up.

## After creating

In the component directory:

1. Look up the latest stable versions in the Maven Central metadata file, reading `<release>`: `curl -s https://repo1.maven.org/maven2/<groupId with dots replaced by slashes>/<artifactId>/maven-metadata.xml`. Do not use the search.maven.org search API; its version data often lags. Look up:
   - For both build tools: `com.puppycrawl.tools:checkstyle`, `com.tngtech.archunit:archunit-junit5`
   - Maven: `com.diffplug.spotless:spotless-maven-plugin`, `org.apache.maven.plugins:maven-checkstyle-plugin`, `org.apache.maven.plugins:maven-pmd-plugin`
   - Gradle: `com.diffplug.spotless:spotless-plugin-gradle`, `net.sourceforge.pmd:pmd-java`
2. Add the code checks and the architecture test:
   - Maven: merge the plugins in `files/pom-plugins.xml` into `<build><plugins>` of `pom.xml`; add `com.tngtech.archunit:archunit-junit5` with `<scope>test</scope>` to `<dependencies>`.
   - Gradle: merge into `build.gradle.kts` as `files/gradle-plugins.kts` describes.
   - Fill in the versions found in step 1.
3. Copy `files/checkstyle.xml` and `files/pmd-ruleset.xml` to the component directory.
4. Copy `files/ArchitectureTest.java` to `src/test/java/<root package directory>/` and `files/archunit.properties` to `src/test/resources/`, replacing `{{root package}}` with the actual root package. `archunit.properties` lets rules pass while there is no code yet, instead of failing with "no classes to check".
5. The generated test `contextLoads() {}` has an empty body, which PMD reports as UncommentedEmptyMethodBody: add a comment saying it only verifies that the Spring context starts.
6. Format the generated code (Maven: `./mvnw spotless:apply`; Gradle: `./gradlew spotlessApply`) and build (Maven: `./mvnw verify`; Gradle: `./gradlew check`); it must pass. When a newer Checkstyle or PMD removed or renamed a rule in the configuration, fix the configuration from the error message and the official documentation.

In Windows PowerShell use `.\mvnw.cmd` and `.\gradlew.bat` instead of `./mvnw` and `./gradlew`.

When downloading dependencies fails with an error about an unreachable private repository URL, check the `<mirror>` in `~/.m2/settings.xml` or `~/.gradle/init.gradle(.kts)`: they redirect downloads elsewhere. Do not change the user's global settings; explain the cause and let the user decide.

## Self-check commands

| Build tool | Format | Lint and architecture tests | Type check | Tests | Build |
|---|---|---|---|---|---|
| Maven | `./mvnw spotless:apply` | `./mvnw -q verify` | part of compilation | `./mvnw test` | `./mvnw verify` |
| Gradle | `./gradlew spotlessApply` | `./gradlew check` | part of compilation | `./gradlew test` | `./gradlew build` |

Maven's `verify` and Gradle's `check` both run the format check, Checkstyle, PMD and every test (`ArchitectureTest` included).

## Tests by kind

How each kind of the scaffold skill's `shared/testing.md` is done on this stack. The project sets up the kinds /architect chose. Tests that need a container (integration, end-to-end, delivery) are heavy: keep them apart from the unit tests (classes named `*IT` run by Failsafe in Maven, a separate test task in Gradle) so `verify` and `check` stay light, and let a project command run them.

| Kind | How |
|---|---|
| Unit | JUnit 5 with Mockito: services and domain logic, repositories faked; `ArchitectureTest` runs with them. Related only: `./mvnw test -Dtest=<class>` or `./gradlew test --tests <class>` |
| Component | None unless the component renders server-side views (then `@WebMvcTest` with HTML assertions renders one view in each state) |
| Integration | Repositories, migrations and messaging against Testcontainers of the production image and version (`@ServiceConnection` wires the connection in recent Spring Boot), Flyway migrations first, container removed afterwards |
| End-to-end | `@SpringBootTest(webEnvironment = RANDOM_PORT)` or the built jar started on a free port against a Testcontainers database, key flows called over HTTP like a client |
| Snapshot | Generated documents, JSON or reports compared with approved files, e.g. with ApprovalTests |
| Delivery | Build the image (`./mvnw spring-boot:build-image`), start it against a database migrated from the last release's schema, check the health endpoint; rollback is the previous image |
| Non-functional | OWASP dependency-check as the fast security scan; load tests with k6 or Gatling against a production-like environment for the targets in the requirements |

Each heavy kind gets a CI job of its own, after the component's job, that prepares its own throwaway environment (Docker is available on the runner).

## Format hook rule

None. Starting Maven or Gradle takes several seconds, which is too slow to run on every changed file. Formatting is part of the self-check commands and runs before committing.

## CI steps

```yaml
  <component>:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: <directory>
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '<Java version>'
          cache: <maven or gradle>
      - run: <Maven: ./mvnw -B verify; Gradle: ./gradlew build>
```

## Version number

- Maven: `./mvnw versions:set -DnewVersion=<version> -DgenerateBackupPoms=false`
- Gradle: change `version = "<version>"` in `build.gradle.kts`

## References

- Google Java Style Guide: https://google.github.io/styleguide/javaguide.html
- Alibaba Java Coding Guidelines: https://github.com/alibaba/p3c
- Spring Boot documentation: https://docs.spring.io/spring-boot/
- ArchUnit: https://www.archunit.org/userguide/html/000_Index.html
- Spotless: https://github.com/diffplug/spotless
- Checkstyle: https://checkstyle.org/
- PMD: https://pmd.github.io/
