---
paths:
  - "{{component directory}}/**"
---

# Python standards: {{component name}}

Sources: PEP 8 and the Google Python Style Guide. ruff checks formatting and common problems, mypy (strict mode) checks types, import-linter (`.importlinter`) checks layering. This file covers what needs judgment.

## Layers

Code lives under `src/<package>/`, in one subpackage per layer:

```
src/<package>/
├── api/            web framework concerns: routes, request and response models, dependency injection
├── services/       business logic and transaction boundaries
├── repositories/   data access (optional, only with a database)
└── domain/         domain model and business rules
```

Dependencies go api → services → repositories → domain only, enforced by `uv run lint-imports`:

- Lower layers never import higher ones. services never import api; repositories never import services.
- domain depends on no web framework or database (FastAPI, Django, SQLAlchemy and so on), so business rules can be tested without the framework.
- As features grow, split each layer into modules by feature (e.g. `services/orders.py`); do not pile features across layers into one file.
- With Django, organize code in Django apps and keep business logic in each app's services, not in views and models; change the `.importlinter` contract to layer each app.

## Types

- Public functions, methods and class attributes have type annotations, and mypy strict passes.
- Data passed between modules uses dataclasses or Pydantic models, not ad-hoc dicts.
- External input (request bodies, configuration, file contents) is validated with Pydantic in the api layer, and the validated types travel inward.

## Habits

- No mutable default arguments.
- No bare `except:` and no `except Exception: pass`. Catch specific exceptions; when you cannot handle one, re-raise it with its cause (`raise ... from e`).
- Paths use pathlib.
- Files, locks and connections are managed with `with`.
- Times use time-zone-aware datetimes (`datetime.now(UTC)`) and are stored in UTC.
- Amounts use Decimal.
- Use logging, not print; never log passwords, tokens or complete personal data.
- Configuration comes from environment variables (e.g. with pydantic-settings), is validated at startup, and missing values stop the process with an error.

## Async code

- Async code never calls blocking functions (synchronous HTTP requests, `time.sleep`, synchronous database drivers); when one is unavoidable, run it in a thread pool.
- A service is either async throughout or sync throughout, never a mix.
- Every call to an external service has a timeout.

## Tests

- pytest, with shared setup in fixtures.
- Test behavior, not internals. Test services with fake repositories; replace external services with fakes; use a real test database (e.g. Testcontainers).
