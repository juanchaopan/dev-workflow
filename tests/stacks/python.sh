#!/usr/bin/env bash
# Python smoke test: creates a project following stacks/python/stack.md, installs the standards, runs the self-check commands,
# then confirms the layer contract and lint rules catch violations.
source "$(dirname "$0")/lib.sh"
F="$STACKS/python/files"

step "Create the project"
PY=$(lts python)
echo "Python $PY"
cd "$WORK"
uv init --package --python "$PY" --name demo-py app
cd app

step "Install the standards"
uv add --dev ruff mypy pytest import-linter
cp "$F/ruff.toml" "$F/mypy.ini" "$F/.gitignore" .
sed 's/PACKAGE/demo_py/g' "$F/.importlinter" > .importlinter
P=src/demo_py
mkdir -p $P/api $P/services $P/domain tests
touch $P/api/__init__.py $P/services/__init__.py $P/domain/__init__.py
cat > $P/__init__.py <<'EOF'
import logging

logger = logging.getLogger(__name__)


def main() -> None:
    logger.info("demo-py started")
EOF
cat > $P/domain/order.py <<'EOF'
from dataclasses import dataclass


@dataclass(frozen=True)
class Order:
    id: int
    title: str
EOF
cat > $P/services/orders.py <<'EOF'
from demo_py.domain.order import Order


def list_orders() -> list[Order]:
    return [Order(id=1, title="first")]
EOF
cat > tests/test_smoke.py <<'EOF'
from demo_py import main
from demo_py.services.orders import list_orders


def test_main_runs() -> None:
    main()


def test_list_orders() -> None:
    assert len(list_orders()) == 1
EOF
uv run ruff check --fix .
uv run ruff format .

step "Self-check commands"
should_pass "format check" uv run ruff format --check .
should_pass "lint" uv run ruff check .
should_pass "architecture check" uv run lint-imports
should_pass "type check" uv run mypy src
should_pass "tests" uv run pytest
should_pass "build" uv build

step "Violations are caught"
printf "from demo_py import api\n\n__all__ = [\"api\"]\n" > $P/services/bad.py
should_fail "services import api" uv run lint-imports
rm $P/services/bad.py
printf "def f() -> None:\n    print(\"x\")\n" > $P/domain/printing.py
should_fail "print instead of logging" uv run ruff check .
rm $P/domain/printing.py
node -e "let b='def f(x: int) -> int:\n    r = 0\n';for(let i=0;i<13;i++)b+='    if x == '+i+':\n        r += '+i+'\n';b+='    return r\n';require('fs').writeFileSync('$P/domain/complex.py',b);"
should_fail "function too complex" uv run ruff check .
rm $P/domain/complex.py

echo
echo "Python smoke test passed (Python $PY)"
