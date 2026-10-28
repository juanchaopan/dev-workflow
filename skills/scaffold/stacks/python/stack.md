# Python

## 识别方法

组件目录里有 `pyproject.toml`、`requirements.txt` 或 `setup.py`。

## 需要的工具

- uv（`uv --version`）。uv 会自己下载需要的 Python 版本，不用另装 Python。

## 创建命令

在仓库根目录运行。Python 版本按架构文档选：

```
uv init --package --python 3.13 --name <名称> <目录>
```

Web 框架等依赖按架构文档添加，例如 `uv add "fastapi[standard]"`。

## 创建后

在组件目录下：

1. `uv add --dev ruff mypy pytest`
2. 把 `files/` 下的 `ruff.toml`、`mypy.ini`、`.gitignore` 复制到组件目录。
3. uv 生成的 `main()` 用 `print` 输出，ruff 的 T20 规则不允许：改成用 logging（`logger = logging.getLogger(__name__)`，`logger.info(...)`）。
4. 建 `tests/test_smoke.py`，写一个导入包并调用 `main()` 的冒烟测试。没有任何测试时 pytest 会以失败退出。
5. `uv run ruff check --fix . && uv run ruff format .`，把生成的代码统一整理一遍。

## 自检命令

| 格式化 | lint | 类型检查 | 测试 | 构建 |
|---|---|---|---|---|
| `uv run ruff format .` | `uv run ruff check .` | `uv run mypy src` | `uv run pytest` | `uv build` |

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
      - run: uv run mypy src
      - run: uv run pytest
```

## 版本号

`pyproject.toml` 的 `version`：`uv version <版本号>`

## 参考资料

- PEP 8：https://peps.python.org/pep-0008/
- Google Python Style Guide：https://google.github.io/styleguide/pyguide.html
- ruff 规则列表：https://docs.astral.sh/ruff/rules/
- mypy：https://mypy.readthedocs.io/
