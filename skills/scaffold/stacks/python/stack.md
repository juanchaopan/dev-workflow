# Python

## How to recognize it

The component directory has `pyproject.toml`, `requirements.txt` or `setup.py`.

## Required tools

- uv (`uv --version`). uv downloads the Python version it needs, so Python does not have to be installed separately.

## Decision points

/architect asks each of these once this stack is chosen. The recommended option is what this document does; for another option, configure the equivalent from the tool's official documentation and keep the self-check commands, hook rules and CI consistent.

| Decision | Options | Recommended |
|---|---|---|
| Python version | The latest stable release / an older release the deployment environment requires | The latest stable release, when every dependency supports it |
| Dependency management | uv / Poetry / pip + pip-tools | uv: fast, one tool for the Python version, virtual environment and dependencies |
| Web framework | FastAPI / Django / Flask / none | FastAPI for API services; Django when an admin, forms and templates are needed together |
| Data access | SQLAlchemy 2 / Django ORM / SQLModel / none | SQLAlchemy 2 outside Django |
| Database migrations | Alembic / Django migrations | Follows the data access choice |
| Type checking | mypy / pyright | mypy |
| Background jobs | None / Celery / RQ / arq | None; for real long-running work, arq in async projects, Celery otherwise |

## Versions

The latest stable Python comes from `node <scaffold skill directory>/shared/versions.mjs lts python`. When a dependency the architecture chose does not support it yet (check its classifiers and release notes), tell the user and let them choose: the latest Python without that dependency (or with an alternative), or the newest Python the dependency supports. Record the choice in the component's technical details ADR.

## Create

From the repository root:

```
uv init --package --python <Python version> --name <name> <directory>
```

Add the web framework and other dependencies from the decision points, e.g. `uv add "fastapi[standard]"`.

## After creating

In the component directory:

1. `uv add --dev ruff mypy pytest import-linter`
2. Copy `ruff.toml`, `mypy.ini`, `.gitignore` and `.importlinter` from `files/` to the component directory. Replace `PACKAGE` in `.importlinter` with the import name of the package under `src/` (e.g. `demo_py`). This file must stay pure ASCII: import-linter reads it with the system encoding on Windows and fails on non-ASCII characters.
3. Create the layer subpackages `src/<package>/api/`, `services/` and `domain/`, each with an empty `__init__.py`. Add `repositories/` when a database is used (it is an optional layer in the contract). import-linter fails when a required layer's subpackage does not exist.
4. The `main()` uv generates prints with `print`, which ruff's T20 rule forbids: switch to logging (`logger = logging.getLogger(__name__)`, `logger.info(...)`).
5. Create `tests/test_smoke.py` with a smoke test that imports the package and calls `main()`. pytest exits with a failure when there are no tests at all.
6. `uv run ruff check --fix . && uv run ruff format .` to tidy the generated code, then run the self-check commands once more.

## Self-check commands

| Format | Lint and architecture | Type check | Tests | Build |
|---|---|---|---|---|
| `uv run ruff format .` | `uv run ruff check . && uv run lint-imports` | `uv run mypy src` | `uv run pytest` | `uv build` |

## Format hook rule

```json
{ "dir": "<directory>", "extensions": [".py"], "format": "uv run ruff check --select I --fix {file} && uv run ruff format {file}", "lint": "uv run ruff check {file}" }
```

Formatting only sorts imports and never removes unused ones: Claude often writes an import first and the code that uses it in the next step, and automatic removal would delete the import it just wrote. Lint reports unused imports for Claude to handle.

## CI steps

```yaml
  <component>:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: <directory>
    steps:
      - uses: actions/checkout@v5
      - uses: astral-sh/setup-uv@v6
        with:
          enable-cache: true
      - run: uv sync --locked
      - run: uv run ruff format --check .
      - run: uv run ruff check .
      - run: uv run lint-imports
      - run: uv run mypy src
      - run: uv run pytest
```

## Version number

`version` in `pyproject.toml`: `uv version <version>`

## References

- PEP 8: https://peps.python.org/pep-0008/
- Google Python Style Guide: https://google.github.io/styleguide/pyguide.html
- ruff rules: https://docs.astral.sh/ruff/rules/
- import-linter: https://import-linter.readthedocs.io/
- mypy: https://mypy.readthedocs.io/
