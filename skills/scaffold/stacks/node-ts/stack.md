# Node.js（TypeScript）

## 识别方法

组件目录有 `package.json` 和 `tsconfig.json`，依赖里没有 react、angular 这类前端框架，入口是服务端程序（例如依赖 fastify、express、@nestjs/core）。

## 需要的工具

- Node.js 当前的 LTS 版本（`node --version`），npm 随 Node.js 一起安装。

## 决策点

/architect 选定这个技术栈后，逐个问用户。推荐项是本文默认的做法；选了别的，按对应工具的官方文档做等效配置，并保证自检命令、钩子规则、CI 三处一致。

| 决策 | 候选 | 推荐 |
|---|---|---|
| Web 框架 | Fastify / Express / NestJS / Hono | Fastify：快，自带 schema 校验和测试注入；团队习惯 Angular 风格的模块和依赖注入时用 NestJS |
| lint | Oxlint（类型感知模式）/ typescript-eslint | Oxlint：快，不依赖 TypeScript 的 JS API，最新的 TypeScript 都能用，覆盖常用的类型规则（any、没有 await 的 Promise、不安全的成员访问等）；需要 typescript-eslint 独有的规则时选它，但 TypeScript 只能用它支持的版本（见"版本"） |
| 输入校验 | zod / TypeBox / valibot | zod；用 Fastify 并且想直接生成 OpenAPI 时用 TypeBox |
| 数据访问 | Drizzle / Prisma / Kysely / 不需要 | Drizzle：接近 SQL、类型安全、没有额外的引擎进程 |
| 包管理器 | npm / pnpm | npm：不用另装工具；单仓库多个 Node 包时用 pnpm |
| 测试 | Vitest / Node 自带的 node:test | Vitest |

## 版本

TypeScript 装最新版。架构检查用 SWC 解析源码，Oxlint 的类型感知模式基于 TypeScript 的 Go 实现，两者都不依赖 TypeScript 的 JS API，不会限制 TypeScript 的版本。

lint 选了 typescript-eslint 时，先现查它支持的最高版本：`node <scaffold 技能目录>/shared/versions.mjs npm typescript typescript-eslint`。查出的版本比最新版旧时（例如 TypeScript 7.0 不带 JS API，typescript-eslint 要等新的 API），不要自己决定，把情况告诉用户，用 AskUserQuestion 让他选：

- 改用 Oxlint，用最新的 TypeScript：代价是少了 typescript-eslint 独有的一部分规则。
- 坚持 typescript-eslint，用查出的版本：代价是落后一个大版本；typescript-eslint 支持新版本以后，Dependabot 的 TypeScript 工具链那组 PR 会把它们一起升上去。

说明里写清：最新版是多少、typescript-eslint 支持到多少、为什么（看它的 peerDependencies 和发布说明）。选择结果写进本组件技术细节的 ADR。

NestJS 例外：它的 CLI 通过 TypeScript 的 JS API 编译，TypeScript 跟着 NestJS 走，保留生成器装的版本，不要单独升到 NestJS 还不支持的大版本。

## 创建命令

**NestJS**：用官方生成器：

```
npx -y @nestjs/cli new <名称> --directory <目录> --package-manager npm --skip-git --strict
```

生成器自带 ESLint 和 typescript-eslint 的配置。lint 选了 Oxlint 时，卸掉 ESLint 相关的包（`npm uninstall eslint @eslint/js typescript-eslint eslint-config-prettier eslint-plugin-prettier globals`，以 `package.json` 里实际有的为准）、删掉 `eslint.config.mjs`，再按下面"创建后"装 Oxlint；选了 typescript-eslint 时保留生成器的配置，加上复杂度和长度规则。

**Fastify、Express、Hono 或不用框架**：没有官方生成器，在仓库根目录手动初始化：

```
mkdir -p <目录> && cd <目录>
npm init -y
npm pkg set type=module
npm install -D typescript "@types/node@^<Node.js 主版本>" tsx vitest prettier dependency-cruiser @swc/core
```

再按 lint 的选择装 lint 工具：

- Oxlint：`npm install -D oxlint oxlint-tsgolint`
- typescript-eslint：`npm install -D "typescript@<"版本"一节查出的版本>" eslint @eslint/js typescript-eslint`

再按决策点装框架和库，例如 `npm install fastify zod`。`@types/node` 的主版本和本机 Node.js 的主版本一致。

## 创建后

手动初始化的项目，在组件目录下：

1. 把 `files/` 下的 `tsconfig.json`、`tsconfig.build.json`、`.prettierrc.json`、`.prettierignore`、`.gitignore`、`.dependency-cruiser.cjs`，以及 lint 配置（Oxlint 用 `.oxlintrc.json`，typescript-eslint 用 `eslint.config.mjs`）复制到组件目录，再把 scaffold 技能 `shared/arch-check.mjs` 复制到组件的 `scripts/` 目录。
2. 按 `rules.md` 的分层建目录。入口 `src/index.ts` 负责组装和启动：启动服务、提供健康检查接口、收到 SIGTERM 时优雅停机。再写一个冒烟测试 `src/index.test.ts`。
3. `npm pkg set scripts.dev="tsx watch src/index.ts" scripts.build="tsc -p tsconfig.build.json" scripts.start="node dist/index.js" scripts.arch="node scripts/arch-check.mjs" scripts.typecheck="tsc --noEmit" scripts.test="vitest run" scripts.format="prettier --write ." scripts.format:check="prettier --check ."`，再按 lint 的选择设 `scripts.lint`：Oxlint 是 `oxlint --type-aware --deny-warnings`，typescript-eslint 是 `eslint .`。
4. `npm run format`，再跑一遍自检命令。

NestJS 项目：装 `dependency-cruiser` 和 `@swc/core`，复制 `.dependency-cruiser.cjs` 和 `arch-check.mjs`，按 `rules.md` 的说明把规则改成按文件名后缀匹配，加上 `arch` 脚本。lint 选了 Oxlint 的，装 `oxlint oxlint-tsgolint`、复制 `.oxlintrc.json`、按上面设 `scripts.lint`；选了 typescript-eslint 的，在它生成的 ESLint 配置里加上 `files/eslint.config.mjs` 里的复杂度和长度规则。

## 自检命令

| 格式化 | lint 和架构检查 | 类型检查 | 测试 | 构建 |
|---|---|---|---|---|
| `npm run format` | `npm run lint && npm run arch` | `npm run typecheck` | `npm test` | `npm run build` |

架构检查没有分析到任何模块时会失败（例如 `@swc/core` 没装上），不会悄悄通过。

## 格式化钩子规则

`lint` 按 lint 的选择填：Oxlint 用 `npx oxlint --type-aware {file}`，typescript-eslint 用 `npx eslint {file}`。

```json
{ "dir": "<目录>", "extensions": [".ts"], "format": "npx prettier --write {file}", "lint": "npx oxlint --type-aware {file}" }
```

## CI 步骤

```yaml
  <组件>:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: <目录>
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: lts/*
          cache: npm
          cache-dependency-path: <目录>/package-lock.json
      - run: npm ci
      - run: npm run format:check
      - run: npm run lint
      - run: npm run arch
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
```

## 版本号

`package.json` 的 `version`：`npm version <版本号> --no-git-tag-version`

## 参考资料

- Oxlint 类型感知模式：https://oxc.rs/docs/guide/usage/linter/type-aware
- typescript-eslint：https://typescript-eslint.io/
- dependency-cruiser 规则写法：https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md
- Node.js 官方文档：https://nodejs.org/docs/latest/api/
- TypeScript 的 tsconfig 选项：https://www.typescriptlang.org/tsconfig/
