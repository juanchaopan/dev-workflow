---
paths:
  - "{{component directory}}/**"
---

# Node.js standards: {{component name}}

Sources: the typescript-eslint recommended rules and the Node.js documentation. Prettier handles formatting; TypeScript strict mode and lint (Oxlint type-aware mode or typescript-eslint, see this component's ADR) catch type and common problems; dependency-cruiser (`.dependency-cruiser.cjs`, `npm run arch`) checks layering. This file covers what needs judgment.

## Layers

Directories by feature, layered inside each feature:

```
src/
├── <feature>/
│   ├── routes/         receive requests, validate input, call services, return results
│   ├── services/       business logic and transaction boundaries
│   ├── repositories/   data access
│   └── domain/         domain model and business rules
├── shared/             configuration, error types and utilities shared by features
└── index.ts            assembles the features and starts the server
```

Enforced by `npm run arch`:

- Dependencies go routes → services → repositories → domain only. Inner layers never depend on routes; routes never skip services to reach repositories.
- domain holds only business rules and depends on no other layer, web framework or database driver.
- services do not depend on the web framework (type references only), so business logic can be tested without HTTP.
- Features do not reference each other; shared code goes to `src/shared/`, and shared depends on no feature.
- No circular dependencies.
- With NestJS, organize code by its modules (`<feature>/<feature>.controller.ts`, `.service.ts`, `.repository.ts`) and switch the directory rules in `.dependency-cruiser.cjs` to file-name suffixes; the layering requirements stay the same.

## Types and validation

- No `any`. External input (request bodies, query parameters, environment variables, messages) is validated against a schema in routes (e.g. zod), and the validated types travel inward.
- Imports used only as types are written `import type`; the architecture check relies on it to tell type references from runtime dependencies.
- Configuration is read and validated once at startup; missing values stop the process with an error.
- Use ES modules; relative imports include the `.js` extension (required by NodeNext module resolution).

## Async code and errors

- Every promise is awaited or explicitly handled (lint's no-floating-promises checks it).
- An error-handling middleware turns errors into responses; stack traces never reach callers.
- Every call to an external service has a timeout; only idempotent operations are retried.
- No synchronous file or crypto APIs (`readFileSync`, `pbkdf2Sync` and the like) on request paths; they block the whole process.

## Running

- Logs use a structured logging library (e.g. pino) with a trace ID per request; never log passwords, tokens or complete personal data.
- Shut down gracefully on SIGTERM: stop accepting requests, finish the ones in flight, then exit.
- Offer a health endpoint.
- Keep no state between requests in the process, so it can run as several instances.

## Tests

- Vitest. Test business logic in services with fake repositories; test endpoints with the framework's injection (e.g. Fastify's `inject`) or supertest.
- Use a real test database, not mocked query results.
