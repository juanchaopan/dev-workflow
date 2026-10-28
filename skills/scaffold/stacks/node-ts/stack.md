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
| 输入校验 | zod / TypeBox / valibot | zod；用 Fastify 并且想直接生成 OpenAPI 时用 TypeBox |
| 数据访问 | Drizzle / Prisma / Kysely / 不需要 | Drizzle：接近 SQL、类型安全、没有额外的引擎进程 |
| 包管理器 | npm / pnpm | npm：不用另装工具；单仓库多个 Node 包时用 pnpm |
| 测试 | Vitest / Node 自带的 node:test | Vitest |

## 创建命令

**NestJS**：用官方生成器，它自带 ESLint 和 Prettier 配置，保留它生成的配置，只装 `rules.md` 和架构检查：

```
npx -y @nestjs/cli new <名称> --directory <目录> --package-manager npm --skip-git --strict
```

**Fastify、Express、Hono 或不用框架**：没有官方生成器，在仓库根目录手动初始化：

```
mkdir -p <目录> && cd <目录>
npm init -y
npm pkg set type=module
npm install -D "typescript@^6" @types/node tsx vitest eslint @eslint/js typescript-eslint prettier dependency-cruiser
```

再按决策点装框架和库，例如 `npm install fastify zod`。

TypeScript 先固定在 6.x：npm 默认装的已经是 TypeScript 7，但 typescript-eslint 和 dependency-cruiser 还不支持它。这两个工具支持 7 以后（看它们的 peerDependencies：`npm view typescript-eslint peerDependencies`），再去掉这个限制。

## 创建后

手动初始化的项目，在组件目录下：

1. 把 `files/` 下的 `tsconfig.json`、`tsconfig.build.json`、`eslint.config.mjs`、`.prettierrc.json`、`.prettierignore`、`.gitignore`、`.dependency-cruiser.cjs` 复制到组件目录，再把 scaffold 技能 `shared/arch-check.mjs` 复制到组件的 `scripts/` 目录。
2. 按 `rules.md` 的分层建目录。入口 `src/index.ts` 负责组装和启动：启动服务、提供健康检查接口、收到 SIGTERM 时优雅停机。再写一个冒烟测试 `src/index.test.ts`。
3. `npm pkg set scripts.dev="tsx watch src/index.ts" scripts.build="tsc -p tsconfig.build.json" scripts.start="node dist/index.js" scripts.lint="eslint ." scripts.arch="node scripts/arch-check.mjs" scripts.typecheck="tsc --noEmit" scripts.test="vitest run" scripts.format="prettier --write ." scripts.format:check="prettier --check ."`
4. `npm run format`，再跑一遍自检命令。

NestJS 项目：装 `dependency-cruiser`，复制 `.dependency-cruiser.cjs` 和 `arch-check.mjs`，按 `rules.md` 的说明把规则改成按文件名后缀匹配，加上 `arch` 脚本；在它生成的 ESLint 配置里加上 `files/eslint.config.mjs` 里的复杂度和长度规则。

## 自检命令

| 格式化 | lint 和架构检查 | 类型检查 | 测试 | 构建 |
|---|---|---|---|---|
| `npm run format` | `npm run lint && npm run arch` | `npm run typecheck` | `npm test` | `npm run build` |

架构检查没有分析到任何模块时会失败（例如装上了 dependency-cruiser 还不支持的 TypeScript 版本），不会悄悄通过。

## 格式化钩子规则

```json
{ "dir": "<目录>", "extensions": [".ts"], "format": "npx prettier --write {file}", "lint": "npx eslint {file}" }
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

- typescript-eslint：https://typescript-eslint.io/
- dependency-cruiser 规则写法：https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md
- Node.js 官方文档：https://nodejs.org/docs/latest/api/
- TypeScript 的 tsconfig 选项：https://www.typescriptlang.org/tsconfig/
