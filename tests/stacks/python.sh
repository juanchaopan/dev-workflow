#!/usr/bin/env bash
# Python 冒烟测试：按 stacks/python/stack.md 建项目、装规范，跑自检命令，再确认分层契约和 lint 规则会拦下违规。
source "$(dirname "$0")/lib.sh"
F="$STACKS/python/files"

step "创建项目"
cd "$WORK"
uv init --package --python 3.13 --name demo-py app
cd app

step "装规范"
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

step "自检命令"
should_pass "格式检查" uv run ruff format --check .
should_pass "lint" uv run ruff check .
should_pass "架构检查" uv run lint-imports
should_pass "类型检查" uv run mypy src
should_pass "测试" uv run pytest
should_pass "构建" uv build

step "违规会被拦下"
printf "from demo_py import api\n\n__all__ = [\"api\"]\n" > $P/services/bad.py
should_fail "services 导入 api" uv run lint-imports
rm $P/services/bad.py
printf "def f() -> None:\n    print(\"x\")\n" > $P/domain/printing.py
should_fail "用 print 而不是 logging" uv run ruff check .
rm $P/domain/printing.py
node -e "let b='def f(x: int) -> int:\n    r = 0\n';for(let i=0;i<13;i++)b+='    if x == '+i+':\n        r += '+i+'\n';b+='    return r\n';require('fs').writeFileSync('$P/domain/complex.py',b);"
should_fail "函数复杂度超标" uv run ruff check .
rm $P/domain/complex.py

echo
echo "Python 冒烟测试通过"
