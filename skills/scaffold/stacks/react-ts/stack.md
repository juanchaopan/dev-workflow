# React（TypeScript，Vite）

## 识别方法

组件目录的 `package.json` 依赖里有 `react`，并且有 `vite.config.ts`（或 `.js`）。

## 需要的工具

- Node.js 当前的 LTS 版本（`node --version`），npm 随 Node.js 一起安装。

## 决策点

/architect 选定这个技术栈后，逐个问用户。推荐项是本文默认的做法；选了别的，按对应工具的官方文档做等效配置，并保证自检命令、钩子规则、CI 三处一致。

| 决策 | 候选 | 推荐 |
|---|---|---|
| 框架 | Vite 单页应用 / Next.js / React Router 框架模式 | Vite 单页应用；需要服务端渲染、搜索引擎收录时用 Next.js（目录结构和本文不同，按它的官方文档） |
| 组件分层 | 页面加展示组件（见 rules.md）/ 不分层 | 页面加展示组件 |
| 路由 | React Router / TanStack Router | React Router |
| 服务器状态 | TanStack Query / SWR | TanStack Query |
| 全局状态 | 不需要 / Zustand / Redux Toolkit | 不需要；确实有跨页面的客户端状态时用 Zustand |
| 样式 | CSS Modules / Tailwind CSS / CSS-in-JS | CSS Modules 加设计令牌 |
| 组件库 | 不用 / MUI / Ant Design / shadcn/ui | 有设计稿时不用，或用 shadcn/ui 这类可以改源码的；要快速做出后台类界面时用 Ant Design 或 MUI |
| 组件展示 | Storybook / 不用 | Storybook：展示组件多、在意视觉时 |
| 视觉回归和端到端测试 | Playwright / 不做 | Playwright：在意视觉、有关键流程时 |

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

1. 把 TypeScript 固定在 6.x：`npm install -D "typescript@^6"`。新版模板默认装 TypeScript 7，但 dependency-cruiser 还不支持它，架构检查会因此什么都分析不到。dependency-cruiser 支持 7 以后（看它的 peerDependencies：`npm view dependency-cruiser peerDependencies`），再去掉这个限制。
2. `@types/node` 的主版本和项目用的 Node.js 主版本对齐（例如 Node 24 用 `npm install -D "@types/node@^24"`），否则装 Storybook 这类工具时会出现 peer 依赖冲突。
3. 在模板的 linter 配置里加上复杂度和长度的上限。React 组件的 JSX 比较长，函数长度上限放宽到 100 行。oxlint 加在 `.oxlintrc.json` 的 `rules` 里：

   ```json
   "eslint/complexity": ["error", 10],
   "eslint/max-depth": ["error", 3],
   "eslint/max-lines-per-function": ["error", { "max": 100, "skipBlankLines": true, "skipComments": true }]
   ```

   并加上 `"ignorePatterns": ["**/*.test.ts", "**/*.test.tsx", "**/*.stories.tsx", ".dependency-cruiser.cjs"]`。用 ESLint 时，在 `eslint.config.js` 里加同样的三条规则（不带 `eslint/` 前缀）。
4. 架构检查：`npm install -D dependency-cruiser`；把 `files/.dependency-cruiser.cjs` 复制到组件目录，把 scaffold 技能 `shared/arch-check.mjs` 复制到组件的 `scripts/` 目录；`npm pkg set scripts.arch="node scripts/arch-check.mjs"`。
5. 单元测试：`npm install -D prettier vitest jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom @testing-library/user-event`；把 `files/` 下的 `.prettierrc.json`、`.prettierignore`、`src/test/setup.ts` 复制到对应位置。在 `vite.config.ts` 第一行加 `/// <reference types="vitest/config" />`，在 `defineConfig` 里加：

   ```ts
   test: {
     projects: [
       {
         extends: true,
         test: { name: 'unit', environment: 'jsdom', setupFiles: './src/test/setup.ts', include: ['src/**/*.test.{ts,tsx}'] },
       },
     ],
   },
   ```

   用 `projects` 的写法，是为了以后装 Storybook 时，它的测试作为另一个项目并列加进来；`include` 只收 `src/` 下的测试，`e2e/` 的 Playwright 测试不会被 Vitest 拾取。
6. `npm pkg set scripts.test="vitest run" scripts.typecheck="tsc -b" scripts.format="prettier --write ." scripts.format:check="prettier --check ."`
7. 模板的 `App.tsx` 是演示页面，换成应用外壳（路由和布局，放在 `src/app/`），按 `rules.md` 建目录：`src/shared/ui/`、`src/shared/lib/`、`src/features/<第一个功能>/{pages,components,data-access}/`。写一个渲染应用外壳的冒烟测试，按页面上能看到的内容断言。
8. `npm run format`，再跑一遍自检命令。

## 可选：Storybook

决策点选了 Storybook 时，在组件目录下：

1. `npx -y storybook@latest init --yes --no-dev`。装完检查 `node_modules/@storybook` 是否存在，不存在就运行 `npm install` 补装。
2. 安装器会改 `vite.config.ts`，往 `test.projects` 里加一个名为 `storybook` 的项目（在浏览器里跑每个 story）。确认第 5 步的 `unit` 项目还在，两个项目并列。
3. 删掉安装器生成的示例 `src/stories/`：它们过不了本项目的 lint 和类型检查。
4. story 从 `@storybook/react-vite` 导入类型（以安装器生成的 `.storybook/main.ts` 为准）。写 story 的约定和 CI 见 scaffold 技能 `shared/visual-testing.md`。

## 可选：视觉回归和端到端测试

决策点选了 Playwright 时，按 scaffold 技能 `shared/visual-testing.md` 配置。启动命令用 `npm run build && npx vite preview --port 4173 --strictPort`，端口 4173。

## 自检命令

| 格式化 | lint 和架构检查 | 类型检查 | 测试 | 构建 |
|---|---|---|---|---|
| `npm run format` | `npm run lint && npm run arch` | `npm run typecheck` | `npm test` | `npm run build` |

用了 Storybook 时，`npm test` 也会在浏览器里跑每个 story，构建一栏再加 `npm run build-storybook`。

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
      - run: npm run arch
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
```

用了 Storybook 时，`npm test` 之前加一步 `npx playwright install --with-deps chromium`（story 测试在浏览器里跑），再加一步 `npm run build-storybook`；视觉回归测试的 job 见 `shared/visual-testing.md`。

## 版本号

`package.json` 的 `version`：`npm version <版本号> --no-git-tag-version`

## 参考资料

- React 官方文档：https://react.dev/learn
- 你可能不需要 Effect：https://react.dev/learn/you-might-not-need-an-effect
- oxlint：https://oxc.rs/docs/guide/usage/linter
- dependency-cruiser 规则写法：https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md
- Storybook for React：https://storybook.js.org/docs/get-started/frameworks/react-vite
- Testing Library：https://testing-library.com/docs/react-testing-library/intro/
