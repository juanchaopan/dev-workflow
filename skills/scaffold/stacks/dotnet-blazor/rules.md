---
paths:
  - "{{组件目录}}/**"
---

# .NET Blazor 规范：{{组件名}}

来源：微软 C# 编码约定（https://learn.microsoft.com/dotnet/csharp/fundamentals/coding-style/coding-conventions）、.NET 代码风格规则、Blazor 官方文档。格式和命名由 `.editorconfig` 加 `dotnet format` 检查，常见问题由构建时的 .NET 分析器检查；这里写需要判断的部分。

## 结构

- 解决方案里 `src/` 放项目，`tests/` 放测试项目。
- 按功能分目录（`Features/Orders/`），组件、服务和模型放在一起。
- 组件（`.razor`）只负责展示和交互；业务逻辑和数据访问放在注入的服务里。组件逻辑较多时，用 code-behind（`.razor.cs`）。

## 组件

- 页面和组件的渲染模式（`@rendermode`）要明确，和架构文档的选择一致。
- 循环渲染列表时用 `@key`。
- `[Parameter]` 只用来接收父组件传入的数据，组件内部不改它；需要改时复制到私有字段。
- 订阅了事件或持有资源的组件，实现 `IDisposable` 或 `IAsyncDisposable` 并在里面释放。
- 尽量不用 JS 互操作；非用不可时，封装在一个服务里。

## 服务和数据

- 依赖注入的生命周期要选对。Blazor Server 下一个用户连接（circuit）会存在很久，不要把 DbContext 以 Scoped 方式直接注入组件，改用 `IDbContextFactory<T>`，每次操作创建一个。
- 配置用 Options 模式（`IOptions<T>`）绑定。
- 密钥在开发时用 user-secrets，在生产用环境变量或密钥服务，不写进 `appsettings.json`。
- 数据库结构变更用 EF Core 迁移。

## 异步

- 一路异步到底，不用 `.Result` 和 `.Wait()`。
- 可能耗时的操作传递 `CancellationToken`。
- 调用外部服务用 `IHttpClientFactory` 创建的 HttpClient，并设置超时。

## 代码习惯

- 开启可空引用类型。不用 `!` 压掉警告，除非能说明为什么一定不为空。
- 日志用 `ILogger<T>` 的结构化写法 `logger.LogInformation("Order {OrderId} paid", id)`，不拼接字符串；不打印密码、令牌和完整的个人信息。
- 金额用 decimal；时间存储用 UTC 的 `DateTimeOffset`。

## 测试

- 服务用 xUnit 测业务逻辑；组件用 bUnit 测渲染结果和交互。
- 数据库用真实的测试实例（例如 Testcontainers），不用 EF Core 的内存提供程序冒充。
