# .NET Blazor (C#)

## How to recognize it

The component directory has a `.sln` or `.slnx` solution, the project file uses `Microsoft.NET.Sdk.Web`, and there are `.razor` files.

## Required tools

- The current LTS of the .NET SDK (`dotnet --version`).

## Decision points

/architect asks each of these once this stack is chosen. The recommended option is what this document does; for another option, configure the equivalent from the tool's official documentation and keep the self-check commands, hook rules and CI consistent.

| Decision | Options | Recommended |
|---|---|---|
| Render mode | Server / WebAssembly / Auto | Server: simplest for intranets or modest user numbers; WebAssembly for offline use or to take load off the server; Auto when both are needed |
| Component layering | Pages plus presentational components (see rules.md) / none | Pages plus presentational components |
| Data access | EF Core / Dapper / external APIs only | EF Core |
| Component library | None / MudBlazor / Fluent UI Blazor | None with design files; MudBlazor to build admin-style UIs fast |
| Test framework | xUnit with bUnit / NUnit with bUnit | xUnit with bUnit |
| Authentication | ASP.NET Core Identity / an external identity provider (OpenID Connect) / none | OpenID Connect to the existing identity system inside a company |

## Versions

The current .NET LTS comes from `node <scaffold skill directory>/shared/versions.mjs lts dotnet`; the templates of the installed SDK set the target framework. When the local SDK is older, tell the user (scaffold step 2).

## Create

From the repository root. `--interactivity` follows the render mode:

```
dotnet new blazor -o <directory>/src/<name> --interactivity Server
dotnet new xunit -o <directory>/tests/<name>.Tests
cd <directory>
dotnet new sln -n <name>
dotnet sln add src/<name> tests/<name>.Tests
dotnet add tests/<name>.Tests reference src/<name>
dotnet add tests/<name>.Tests package bunit
dotnet add tests/<name>.Tests package TngTech.ArchUnitNET.xUnit
dotnet new gitignore
```

## After creating

In the component directory:

1. Copy `.editorconfig` and `Directory.Build.props` from `files/` to the component directory (the level of the solution); they apply to every project below it.
2. Architecture tests: copy `files/ArchitectureTests.cs` to `tests/<name>.Tests/`. Replace `{{root namespace}}` with the project's root namespace (usually the project name) and `{{root namespace regex}}` with the same name with a backslash before each dot (e.g. `My.App` becomes `My\.App`). Delete the template's `UnitTest1.cs`.
3. Create the directories from `rules.md`: `src/<name>/Features/<first feature>/{Pages,Components,Services,Models}/` and `src/<name>/Shared/Components/`.
4. Write a bUnit smoke test that renders the home page component and asserts on visible content.
5. `dotnet format`, then `dotnet build -warnaserror` and `dotnet test`. Fix any warnings in the template's code according to the rules.

## Self-check commands

| Format | Lint | Type check | Tests (architecture tests included) | Build |
|---|---|---|---|---|
| `dotnet format` | `dotnet format --verify-no-changes` | part of the build | `dotnet test` | `dotnet build -warnaserror` |

## Format hook rule

```json
{ "dir": "<directory>", "extensions": [".cs"], "format": "dotnet format whitespace --folder --include {relfile}" }
```

Only whitespace and indentation, which needs no solution load and is fast. Naming and code style are checked by the analyzers during the build.

## CI steps

```yaml
  <component>:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: <directory>
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: <SDK major>.0.x
      - run: dotnet restore
      - run: dotnet format --verify-no-changes --no-restore
      - run: dotnet build --no-restore -warnaserror
      - run: dotnet test --no-build
```

`dotnet-version` matches the SDK major used locally.

## Version number

`<Version>` in `Directory.Build.props`; edit the value directly.

## References

- Microsoft C# coding conventions: https://learn.microsoft.com/dotnet/csharp/fundamentals/coding-style/coding-conventions
- .NET code style rules: https://learn.microsoft.com/dotnet/fundamentals/code-analysis/code-style-rule-options
- Blazor documentation: https://learn.microsoft.com/aspnet/core/blazor/
- bUnit: https://bunit.dev/
- ArchUnitNET: https://archunitnet.readthedocs.io/
