# .NET Blazor（C#）

## 识别方法

组件目录里有 `.sln` 或 `.slnx` 解决方案，项目文件用 `Microsoft.NET.Sdk.Web`，并且有 `.razor` 文件。

## 需要的工具

- .NET SDK 当前的 LTS 版本（`dotnet --version`）。

## 创建命令

在仓库根目录运行。渲染模式（`--interactivity`：`Server`、`WebAssembly` 或 `Auto`）按架构文档选：

```
dotnet new blazor -o <目录>/src/<名称> --interactivity Server
dotnet new xunit -o <目录>/tests/<名称>.Tests
cd <目录>
dotnet new sln -n <名称>
dotnet sln add src/<名称> tests/<名称>.Tests
dotnet add tests/<名称>.Tests reference src/<名称>
dotnet add tests/<名称>.Tests package bunit
dotnet new gitignore
```

## 创建后

在组件目录下：

1. 把 `files/` 下的 `.editorconfig`、`Directory.Build.props` 复制到组件目录（解决方案所在的那一层）。它们对下面所有项目生效。
2. 写一个 bUnit 冒烟测试：渲染首页组件，断言页面上能看到的内容。
3. `dotnet format`，再 `dotnet build -warnaserror`。模板自带的代码有警告时，按规则修好。

## 自检命令

| 格式化 | lint | 类型检查 | 测试 | 构建 |
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
          dotnet-version: 10.0.x
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
