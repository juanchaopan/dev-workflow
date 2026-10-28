# Node.js（TypeScript）

## 识别方法

组件目录有 `package.json` 和 `tsconfig.json`，依赖里没有 react、angular 这类前端框架，入口是服务端程序（例如依赖 fastify、express、@nestjs/core）。

## 需要的工具

- Node.js 当前的 LTS 版本（`node --version`），npm 随 Node.js 一起安装。

## 创建命令

框架按架构文档选。

**NestJS**：用官方生成器，它自带 ESLint 和 Prettier 配置，保留它生成的配置，只装 `rules.md`：

```
npx -y @nestjs/cli new <名称> --directory <目录> --package-manager npm --skip-git --strict
```

**Fastify、Express 或不用框架**：没有官方生成器，在仓库根目录手动初始化：

```
mkdir -p <目录> && cd <目录>
npm init -y
npm pkg set type=module
npm install -D typescript @types/node tsx vitest eslint @eslint/js typescript-eslint prettier
```

再按架构文档装框架，例如 `npm install fastify`。

## 创建后

手动初始化的项目，在组件目录下：

1. 把 `files/` 下的 `tsconfig.json`、`tsconfig.build.json`、`eslint.config.mjs`、`.prettierrc.json`、`.prettierignore`、`.gitignore` 复制到组件目录。
2. 写入口 `src/index.ts`（启动服务、提供健康检查接口、收到 SIGTERM 时优雅停机），以及一个冒烟测试 `src/index.test.ts`。
3. `npm pkg set scripts.dev="tsx watch src/index.ts" scripts.build="tsc -p tsconfig.build.json" scripts.start="node dist/index.js" scripts.lint="eslint ." scripts.typecheck="tsc --noEmit" scripts.test="vitest run" scripts.format="prettier --write ." scripts.format:check="prettier --check ."`
4. `npm run format`

## 自检命令

| 格式化 | lint | 类型检查 | 测试 | 构建 |
|---|---|---|---|---|
| `npm run format` | `npm run lint` | `npm run typecheck` | `npm test` | `npm run build` |

NestJS 项目用它生成的 `format`、`lint`、`test`、`build` 命令，类型检查用 `npx tsc --noEmit`。

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
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
```

## 版本号

`package.json` 的 `version`：`npm version <版本号> --no-git-tag-version`

## 参考资料

- typescript-eslint：https://typescript-eslint.io/
- Node.js 官方文档：https://nodejs.org/docs/latest/api/
- TypeScript 的 tsconfig 选项：https://www.typescriptlang.org/tsconfig/
