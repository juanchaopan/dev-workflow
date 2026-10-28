# .NET Blazor（C#）

## 识别方法

组件目录里有 `.sln` 或 `.slnx` 解决方案，项目文件用 `Microsoft.NET.Sdk.Web`，并且有 `.razor` 文件。

## 需要的工具

- .NET SDK 当前的 LTS 版本（`dotnet --version`）。

## 决策点

/architect 选定这个技术栈后，逐个问用户。推荐项是本文默认的做法；选了别的，按对应工具的官方文档做等效配置，并保证自检命令、钩子规则、CI 三处一致。

| 决策 | 候选 | 推荐 |
|---|---|---|
| 渲染模式 | Server / WebAssembly / Auto | Server：内网或用户量不大时最简单；要离线或减轻服务器压力时用 WebAssembly；两者都要时用 Auto |
| 组件分层 | 页面加展示组件（见 rules.md）/ 不分层 | 页面加展示组件 |
| 数据访问 | EF Core / Dapper / 只调外部 API | EF Core |
| 组件库 | 不用 / MudBlazor / Fluent UI Blazor | 有设计稿时不用；要快速做出后台类界面时用 MudBlazor |
| 测试框架 | xUnit 加 bUnit / NUnit 加 bUnit | xUnit 加 bUnit |
| 认证 | ASP.NET Core Identity / 外部身份提供方（OpenID Connect）/ 不需要 | 企业内部用 OpenID Connect 接入已有的身份系统 |

## 创建命令

在仓库根目录运行。`--interactivity` 按渲染模式选：

```
dotnet new blazor -o <目录>/src/<名称> --interactivity Server
dotnet new xunit -o <目录>/tests/<名称>.Tests
cd <目录>
dotnet new sln -n <名称>
dotnet sln add src/<名称> tests/<名称>.Tests
dotnet add tests/<名称>.Tests reference src/<名称>
dotnet add tests/<名称>.Tests package bunit
dotnet add tests/<名称>.Tests package TngTech.ArchUnitNET.xUnit
dotnet new gitignore
```

## 创建后

在组件目录下：

1. 把 `files/` 下的 `.editorconfig`、`Directory.Build.props` 复制到组件目录（解决方案所在的那一层），它们对下面所有项目生效。
2. 架构测试：把 `files/ArchitectureTests.cs` 复制到 `tests/<名称>.Tests/`。`{{根命名空间}}` 换成项目的根命名空间（通常就是项目名），`{{根命名空间的正则写法}}` 换成同一个名字里的点前面加反斜杠的写法（例如 `My.App` 写成 `My\.App`）。删掉模板自带的 `UnitTest1.cs`。
3. 按 `rules.md` 建目录：`src/<名称>/Features/<第一个功能>/{Pages,Components,Services,Models}/`、`src/<名称>/Shared/Components/`。
4. 写一个 bUnit 冒烟测试：渲染首页组件，断言页面上能看到的内容。
5. `dotnet format`，再 `dotnet build -warnaserror` 和 `dotnet test`。模板自带的代码有警告时，按规则修好。

## 自检命令

| 格式化 | lint | 类型检查 | 测试（含架构测试） | 构建 |
|---|---|---|---|---|
| `dotnet format` | `dotnet format --verify-no-changes` | 包含在构建里 | `dotnet test` | `dotnet build -warnaserror` |

## 格式化钩子规则

```json
{ "dir": "<目录>", "extensions": [".cs"], "format": "dotnet format whitespace --folder --include {relfile}" }
```

只做空白和缩进格式化，不需要加载整个解决方案，速度快。命名和代码风格问题由构建时的分析器检查。

## CI 步骤

```yaml
  <组件>:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: <目录>
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: <SDK 主版本>.0.x
      - run: dotnet restore
      - run: dotnet format --verify-no-changes --no-restore
      - run: dotnet build --no-restore -warnaserror
      - run: dotnet test --no-build
```

`dotnet-version` 和本地用的 SDK 主版本保持一致。

## 版本号

`Directory.Build.props` 的 `<Version>`，直接修改这个值。

## 参考资料

- 微软 C# 编码约定：https://learn.microsoft.com/dotnet/csharp/fundamentals/coding-style/coding-conventions
- .NET 代码风格规则：https://learn.microsoft.com/dotnet/fundamentals/code-analysis/code-style-rule-options
- Blazor 官方文档：https://learn.microsoft.com/aspnet/core/blazor/
- bUnit：https://bunit.dev/
- ArchUnitNET：https://archunitnet.readthedocs.io/
