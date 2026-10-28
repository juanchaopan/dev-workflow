# React（TypeScript，Vite）

## 识别方法

组件目录的 `package.json` 依赖里有 `react`，并且有 `vite.config.ts`（或 `.js`）。

## 需要的工具

- Node.js 当前的 LTS 版本（`node --version`），npm 随 Node.js 一起安装。

## 创建命令

在仓库根目录运行：

```
npm create vite@latest <目录> -- --template react-ts --no-interactive
cd <目录> && npm install
```

create-vite 不认识 `--no-interactive` 时去掉这个参数。

模板自带 linter 和它的配置，保留不动：新版模板用 oxlint（`.oxlintrc.json`，已开启 React Hooks 规则），旧版模板用 ESLint（`eslint.config.js`）。下文把模板 `lint` 脚本用的那个工具叫作"模板的 linter"。

## 创建后

在组件目录下：

1. `npm install -D prettier vitest jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom @testing-library/user-event`
2. 把 `files/` 下的 `.prettierrc.json`、`.prettierignore`、`src/test/setup.ts` 复制到组件目录的对应位置。
3. 在 `vite.config.ts` 第一行加 `/// <reference types="vitest/config" />`，并在 `defineConfig` 里加上 `test: { environment: 'jsdom', setupFiles: './src/test/setup.ts' }`。
4. `npm pkg set scripts.test="vitest run" scripts.typecheck="tsc -b" scripts.format="prettier --write ." scripts.format:check="prettier --check ."`
5. 写一个渲染 `App` 的冒烟测试（`src/App.test.tsx`），按页面上能看到的内容断言，例如 `screen.getByRole('heading', { level: 1 })`。
6. `npm run format`，把生成的代码统一格式化一遍。

## 自检命令

| 格式化 | lint | 类型检查 | 测试 | 构建 |
|---|---|---|---|---|
| `npm run format` | `npm run lint` | `npm run typecheck` | `npm test` | `npm run build` |

## 格式化钩子规则

`lint` 里填模板的 linter：oxlint 用 `npx oxlint {file}`，ESLint 用 `npx eslint {file}`。

```json
{ "dir": "<目录>", "extensions": [".ts", ".tsx", ".css"], "format": "npx prettier --write {file}", "lint": "npx oxlint {file}" }
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

- React 官方文档：https://react.dev/learn
- 你可能不需要 Effect：https://react.dev/learn/you-might-not-need-an-effect
- oxlint：https://oxc.rs/docs/guide/usage/linter
- Testing Library：https://testing-library.com/docs/react-testing-library/intro/
