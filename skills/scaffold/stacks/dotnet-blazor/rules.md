---
paths:
  - "{{组件目录}}/**"
---

# .NET Blazor 规范：{{组件名}}

来源：微软 C# 编码约定（https://learn.microsoft.com/dotnet/csharp/fundamentals/coding-style/coding-conventions）、.NET 代码风格规则、Blazor 官方文档，以及通行的容器组件和展示组件分层。格式和命名由 `.editorconfig` 加 `dotnet format` 检查，常见问题由构建时的 .NET 分析器检查，分层由 `ArchitectureTests`（ArchUnitNET）检查；这里写需要判断的部分。

## 分层：页面和展示组件

```
src/<项目>/
├── Features/<功能>/
│   ├── Pages/          页面：带 @page 路由的组件
│   ├── Components/     展示组件
│   ├── Services/       业务逻辑、调用 API
│   ├── Data/           数据访问（EF Core 的 DbContext、仓储）
│   └── Models/         类型定义
├── Shared/Components/  几个功能共用的展示组件
└── Components/         App、路由、布局（模板生成的）
```

**页面（容器组件）**负责"数据从哪来、到哪去"：注入 Services，调用业务逻辑和 API，处理加载中、出错和空数据，持有状态；通过 `[Parameter]` 把数据交给子组件，通过子组件的 `EventCallback` 更新状态；需要父子同步一个值时用 `@bind-<参数名>` 双向绑定。

**展示组件**只负责"长什么样"：

- 无状态：数据只从 `[Parameter]` 进，变化只通过 `EventCallback` 出。内部只允许纯界面状态，例如展开、收起。
- 不注入任何东西（没有 `@inject` 和 `[Inject]`），不调 API，不访问数据库。需要什么数据，由页面传进来。
- 给定参数就能独立渲染，可以用 bUnit 单独测试。

由 `ArchitectureTests` 强制：展示组件（`Features/*/Components`、`Shared/Components`）不注入任何东西，不依赖 Services 和 Data；功能之间互不依赖。

## 组件写法

- 页面和组件的渲染模式（`@rendermode`）要明确，和架构文档的选择一致。
- 循环渲染列表时用 `@key`。
- `[Parameter]` 只用来接收父组件传入的数据，组件内部不改它；需要改时复制到私有字段。
- 订阅了事件或持有资源的组件，实现 `IDisposable` 或 `IAsyncDisposable` 并在里面释放。
- 组件逻辑较多时，用 code-behind（`.razor.cs`）。
- 尽量不用 JS 互操作；非用不可时，封装在一个服务里，由页面调用。

## 服务和数据

- 依赖注入的生命周期要选对。Blazor Server 下一个用户连接（circuit）会存在很久，不要把 DbContext 以 Scoped 方式直接注入组件，改用 `IDbContextFactory<T>`，每次操作创建一个。
- 配置用 Options 模式（`IOptions<T>`）绑定。
- 密钥在开发时用 user-secrets，在生产用环境变量或密钥服务，不写进 `appsettings.json`。
- 数据库结构变更用 EF Core 迁移。

## 异步

- 一路异步到底，不用 `.Result` 和 `.Wait()`。
- 可能耗时的操作传递 `CancellationToken`。
- 调用外部服务用 `IHttpClientFactory` 创建的 HttpClient，并设置超时。

## 样式

- 颜色、字号、间距用设计令牌（CSS 自定义属性 `var(--...)`），不写死颜色值和像素值。
- 组件样式用 CSS 隔离（`<组件>.razor.css`），不改写子组件和全局样式。

## 代码习惯

- 开启可空引用类型。不用 `!` 压掉警告，除非能说明为什么一定不为空。
- 日志用 `ILogger<T>` 的结构化写法 `logger.LogInformation("Order {OrderId} paid", id)`，不拼接字符串；不打印密码、令牌和完整的个人信息。
- 金额用 decimal；时间存储用 UTC 的 `DateTimeOffset`。

## 测试

- 服务用 xUnit 测业务逻辑；展示组件用 bUnit 测"给定参数渲染什么、点了触发什么回调"。
- 数据库用真实的测试实例（例如 Testcontainers），不用 EF Core 的内存提供程序冒充。
