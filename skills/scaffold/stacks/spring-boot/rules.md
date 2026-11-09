---
paths:
  - "{{component directory}}/**"
---

# Spring Boot standards: {{component name}}

Sources: the Google Java Style Guide, the Alibaba Java Coding Guidelines and the Spring Boot documentation. Spotless (google-java-format) handles formatting, Checkstyle and PMD catch common code problems, and `ArchitectureTest` (ArchUnit) checks layering. This file covers what needs judgment.

## Layers

Packages by feature, layered inside each feature:

```
{{root package}}/
├── <feature>/
│   ├── controller/    receive requests, validate parameters, call services, return DTOs
│   ├── service/       business logic and transaction boundaries
│   ├── repository/    data access
│   ├── domain/        entities and domain rules
│   └── dto/           request and response types of the API
└── shared/            configuration, exception handling and utilities shared by features
```

Dependencies go controller → service → repository only, enforced by `ArchitectureTest`:

- Controllers are called only from outside and no layer depends on them; services are used only by controllers; repositories only by services. Controllers never skip services to reach repositories.
- Controllers never touch entities (`@Entity`); parameters and return values are DTOs. Entity-to-DTO conversion lives in one place.
- Feature packages have no circular dependencies. When a feature needs another feature's data, it calls that feature's service, never its repository.
- Constructor injection only; no `System.out` or `System.err`.

## Dependency injection and configuration

- Dependencies are final fields injected through the constructor.
- Configuration is bound to type-safe objects with `@ConfigurationProperties`, not `@Value` scattered everywhere.
- Secrets and passwords never go into `application.yml`; they come from environment variables, and environments are separated with profiles.

## APIs

- Parameters are validated with jakarta.validation annotations (`@Valid`, `@NotBlank` and so on).
- Exceptions are handled in one `@RestControllerAdvice`, with error responses in `ProblemDetail` (RFC 9457) format; stack traces never reach callers.
- APIs are versioned (path `/api/v1/...`); breaking changes get a new version.
- List endpoints are always paginated.

## Data and transactions

- `@Transactional` goes on public service methods, never on controllers or repositories; read-only methods use `readOnly = true`.
- Watch for JPA N+1 queries: associations are lazy by default; use fetch joins or `@EntityGraph` where needed.
- Schema changes use migration scripts (Flyway or Liquibase, as the architecture chose); merged scripts are never edited.
- Amounts use `BigDecimal`, never float or double (Alibaba guidelines).
- Times use java.time; storage and transport use UTC `Instant` or `OffsetDateTime`.

## Concurrency and resources

- Thread pools are created explicitly with `ThreadPoolExecutor`, with a bounded queue and a rejection policy, never with the `Executors` factory methods whose unbounded queues can exhaust memory (Alibaba guidelines).
- Every call to an external service sets connect and read timeouts.
- Singleton beans hold no mutable request-related state.

## Coding habits

- No magic values: numbers and strings with business meaning become constants or enums (Alibaba guidelines).
- Methods returning collections return empty collections, never null. Use `Optional` as a return type where there may be no value, never as a field or parameter.
- Logs use SLF4J placeholders, `log.info("order {} paid", id)`, never string concatenation; never log passwords, tokens or complete personal data.
- A caught exception is either handled or wrapped and rethrown with its cause, never swallowed.

## Tests

- Unit tests cover the business logic in services; endpoints use `@WebMvcTest` and data access `@DataJpaTest`. These slice tests are much faster than a full `@SpringBootTest`.
- Tests that need a database start a real one with Testcontainers, not an in-memory database that differs from production.
- Test method names state the scenario and the expectation, e.g. `shouldRejectOrderWhenStockIsInsufficient`.
