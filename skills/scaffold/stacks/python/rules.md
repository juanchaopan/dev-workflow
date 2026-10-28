---
paths:
  - "{{组件目录}}/**"
---

# Python 规范：{{组件名}}

来源：PEP 8、Google Python Style Guide。格式和常见问题由 ruff 检查，类型由 mypy（strict 模式）检查；这里写需要判断的部分。

## 结构

- src 布局：代码在 `src/<包名>/`，测试在 `tests/`，目录结构和代码对应。
- 按功能分模块。Web 框架相关的代码（路由、请求和响应模型）和业务逻辑分开，业务逻辑不依赖框架。
- 依赖只通过 `uv add` 添加，并提交 `uv.lock`。

## 类型

- 公开的函数、方法和类属性都写类型注解，mypy strict 必须通过。
- 模块之间传数据用 dataclass 或 Pydantic 模型，不用随意的 dict。
- 外部输入（请求体、配置、文件内容）在边界处用 Pydantic 校验。

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
- 测行为，不测内部实现。外部服务用假的实现替换；数据库用真实的测试实例（例如 Testcontainers）。
