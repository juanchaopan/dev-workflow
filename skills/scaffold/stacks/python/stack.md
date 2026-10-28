# Python

## 识别方法

组件目录里有 `pyproject.toml`、`requirements.txt` 或 `setup.py`。

## 需要的工具

- uv（`uv --version`）。uv 会自己下载需要的 Python 版本，不用另装 Python。

## 决策点

/architect 选定这个技术栈后，逐个问用户。推荐项是本文默认的做法；选了别的，按对应工具的官方文档做等效配置，并保证自检命令、钩子规则、CI 三处一致。

| 决策 | 候选 | 推荐 |
|---|---|---|
| Python 版本 | 最近的两三个稳定版本 | 最新稳定版，依赖都支持时 |
| 依赖管理 | uv / Poetry / pip + pip-tools | uv：速度快，一个工具管 Python 版本、虚拟环境和依赖 |
| Web 框架 | FastAPI / Django / Flask / 不需要 | 纯接口服务用 FastAPI；要后台管理、表单、模板一整套时用 Django |
| 数据访问 | SQLAlchemy 2 / Django ORM / SQLModel / 不需要 | 非 Django 项目用 SQLAlchemy 2 |
| 数据库迁移 | Alembic / Django migrations | 跟着数据访问的选择走 |
| 类型检查 | mypy / pyright | mypy |
| 后台任务 | 不需要 / Celery / RQ / arq | 不需要；确实有耗时任务时，异步项目用 arq，其他用 Celery |

## 创建命令

在仓库根目录运行：

```
uv init --package --python <Python 版本> --name <名称> <目录>
```

Web 框架等依赖按决策点添加，例如 `uv add "fastapi[standard]"`。

## 创建后

在组件目录下：

1. `uv add --dev ruff mypy pytest import-linter`
2. 把 `files/` 下的 `ruff.toml`、`mypy.ini`、`.gitignore`、`.importlinter` 复制到组件目录。把 `.importlinter` 里的 `PACKAGE` 换成 `src/` 下包的导入名（例如 `demo_py`）。这个文件必须保持纯 ASCII：import-linter 在 Windows 上用系统编码读它，出现中文就会报错。
3. 建分层的子包：`src/<包名>/api/`、`services/`、`domain/`，各放一个空的 `__init__.py`。用到数据库时再建 `repositories/`（它在契约里是可选层）。必选层的子包不存在时 import-linter 会报错。
4. uv 生成的 `main()` 用 `print` 输出，ruff 的 T20 规则不允许：改成用 logging（`logger = logging.getLogger(__name__)`，`logger.info(...)`）。
5. 建 `tests/test_smoke.py`，写一个导入包并调用 `main()` 的冒烟测试。没有任何测试时 pytest 会以失败退出。
6. `uv run ruff check --fix . && uv run ruff format .`，把生成的代码统一整理一遍，再跑一遍自检命令。

## 自检命令

| 格式化 | lint 和架构检查 | 类型检查 | 测试 | 构建 |
|---|---|---|---|---|
| `uv run ruff format .` | `uv run ruff check . && uv run lint-imports` | `uv run mypy src` | `uv run pytest` | `uv build` |

## 格式化钩子规则

```json
{ "dir": "<目录>", "extensions": [".py"], "format": "uv run ruff check --select I --fix {file} && uv run ruff format {file}", "lint": "uv run ruff check {file}" }
```

格式化只自动整理导入顺序，不自动删除未使用的导入：Claude 常常先写导入、下一步再写用到它的代码，自动删除会把刚写的导入删掉。未使用的导入由 lint 报出来，交给 Claude 处理。

## CI 步骤

```yaml
  <组件>:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: <目录>
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

## 版本号

`pyproject.toml` 的 `version`：`uv version <版本号>`

## 参考资料

- PEP 8：https://peps.python.org/pep-0008/
- Google Python Style Guide：https://google.github.io/styleguide/pyguide.html
- ruff 规则列表：https://docs.astral.sh/ruff/rules/
- import-linter：https://import-linter.readthedocs.io/
- mypy：https://mypy.readthedocs.io/
