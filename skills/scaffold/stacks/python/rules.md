---
paths:
  - "{{组件目录}}/**"
---

# Python 规范：{{组件名}}

来源：PEP 8、Google Python Style Guide。格式和常见问题由 ruff 检查，类型由 mypy（strict 模式）检查，分层由 import-linter（`.importlinter`）检查；这里写需要判断的部分。

## 分层

代码在 `src/<包名>/` 下，按层分子包：

```
src/<包名>/
├── api/            Web 框架相关：路由、请求和响应模型、依赖注入
├── services/       业务逻辑和事务边界
├── repositories/   数据访问（可选，用到数据库时才有）
└── domain/         领域模型和业务规则
```

依赖方向只能是 api → services → repositories → domain，由 `uv run lint-imports` 强制：

- 下层不能导入上层。services 不能导入 api，repositories 不能导入 services。
- domain 不依赖 Web 框架和数据库（FastAPI、Django、SQLAlchemy 等），这样业务规则可以脱离框架单独测试。
- 功能多了以后，在每一层里再按功能分模块（例如 `services/orders.py`），不要跨层堆在一个文件里。
- 用 Django 时，按 Django 的 app 组织代码，每个 app 内部仍然把业务逻辑放在 services 里，不写进 views 和 models；`.importlinter` 的契约改成每个 app 的分层。

## 类型

- 公开的函数、方法和类属性都写类型注解，mypy strict 必须通过。
- 模块之间传数据用 dataclass 或 Pydantic 模型，不用随意的 dict。
- 外部输入（请求体、配置、文件内容）在 api 层用 Pydantic 校验，校验后的类型再往里传。

## 习惯

- 不用可变对象作默认参数。
- 不写裸的 `except:`，也不写 `except Exception: pass`。捕获具体的异常；处理不了就带上原因重新抛出（`raise ... from e`）。
- 文件路径用 pathlib。
- 文件、锁、连接用 with 管理。
- 时间用带时区的 datetime（`datetime.now(UTC)`），存储用 UTC。
- 金额用 Decimal。
- 用 logging，不用 print；日志不打印密码、令牌和完整的个人信息。
- 配置从环境变量读取（例如用 pydantic-settings），启动时校验，缺了就报错退出。

## 异步

- 异步代码里不调用阻塞的函数（同步的 HTTP 请求、`time.sleep`、同步的数据库驱动）；非调用不可时，放到线程池里执行。
- 一个服务要么整体异步、要么整体同步，不混着用。
- 调用外部服务都设置超时。

## 测试

- 用 pytest，共用的准备工作写成 fixture。
- 测行为，不测内部实现。services 用假的 repository 测；外部服务用假的实现替换；数据库用真实的测试实例（例如 Testcontainers）。
