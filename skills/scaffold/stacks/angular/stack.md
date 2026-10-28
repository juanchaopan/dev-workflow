# Angular（TypeScript）

## 识别方法

组件目录里有 `angular.json`。

## 需要的工具

- Node.js 当前的 LTS 版本（`node --version`），npm 随 Node.js 一起安装。
- 每个大版本的 Angular CLI 都要求最低的 Node.js 小版本。CLI 报 "requires a minimum Node.js version" 时，告诉用户两个办法：升级 Node.js；或者用上一个大版本的 CLI，把下面命令里的 `@latest` 换成 `@<主版本号>`。不要自己升级系统里的 Node.js。

## 决策点

/architect 选定这个技术栈后，逐个问用户。推荐项是本文默认的做法；选了别的，按对应工具的官方文档做等效配置，并保证自检命令、钩子规则、CI 三处一致。

| 决策 | 候选 | 推荐 |
|---|---|---|
| 组件分层 | 页面加展示组件（见 rules.md）/ 不分层 | 页面加展示组件 |
| 状态管理 | signal 加服务 / NgRx SignalStore / NgRx Store | signal 加服务；状态多、跨页面共享多时用 NgRx SignalStore |
| 样式 | SCSS / CSS / Tailwind CSS | SCSS 加设计令牌 |
| 组件库 | 不用 / Angular Material / PrimeNG | 有设计稿时不用，按设计稿做；要快速做出后台类界面时用 Angular Material |
| 单元测试 | Vitest（CLI 默认）/ Karma 加 Jasmine | Vitest |
| 组件展示 | Storybook / 不用 | Storybook：展示组件多、在意视觉时 |
| 视觉回归和端到端测试 | Playwright / 不做 | Playwright：在意视觉、有关键流程时 |
| 服务端渲染 | 不用 / SSR | 不用；需要搜索引擎收录或首屏很快时用 SSR |

## 创建命令

在仓库根目录运行，`<名称>` 是组件名，`<目录>` 是组件目录（例如 `apps/web`）：

```
NG_CLI_ANALYTICS=false npx -y @angular/cli@latest new <名称> --directory <目录> --defaults --routing --style=scss --ssr=false --skip-git --ai-config=none
```

- `--skip-git`：仓库由上层统一管理。
- 选了 SSR 时去掉 `--ssr=false`；样式选了别的时改 `--style`。
- CLI 不认识 `--ai-config` 时去掉这个参数。
- 安装依赖时 npm 报 `Cannot read properties of null (reading 'edgesOut')`，是部分 npm 11 版本在处理 peer 依赖时的已知问题：在组件目录下运行 `npm install --legacy-peer-deps` 补装依赖；后面的 `ng add` 也会触发同样的问题，就在组件目录建一个 `.npmrc`，写入 `legacy-peer-deps=true`，并告诉用户升级 npm（`npm install -g npm@latest`）可以根治。

## 创建后

在组件目录下：

1. 查项目的 Angular 主版本号（`package.json` 里 `@angular/core` 的版本），装同一主版本的 angular-eslint：`NG_CLI_ANALYTICS=false npx ng add angular-eslint@<主版本号> --skip-confirmation`。它会生成 `eslint.config.js`，并在 `angular.json` 里配好 `ng lint`。如果输出里提示版本不匹配、没有生成 `eslint.config.js`，再运行一次同样的命令。
2. 在 `eslint.config.js` 的配置数组末尾加上复杂度和长度的上限：

   ```js
     {
       files: ['**/*.ts'],
       ignores: ['**/*.spec.ts', '**/*.stories.ts'],
       rules: {
         complexity: ['error', 10],
         'max-depth': ['error', 3],
         'max-lines-per-function': ['error', { max: 60, skipBlankLines: true, skipComments: true }],
       },
     },
   ```

3. 架构检查：`npm install -D dependency-cruiser`；把 `files/.dependency-cruiser.cjs` 复制到组件目录，把 scaffold 技能 `shared/arch-check.mjs` 复制到组件的 `scripts/` 目录；`npm pkg set scripts.arch="node scripts/arch-check.mjs"`。
4. 按 `rules.md` 建目录：`src/app/core/`、`src/app/shared/ui/`、`src/app/shared/util/`，以及第一个功能的 `src/app/features/<功能>/{pages,components,data-access,models}/`。空目录放一个 `.gitkeep`。
5. `npm install -D prettier`，把 `files/` 下的 `.prettierrc.json`、`.prettierignore` 复制到组件目录，`npm pkg set scripts.format="prettier --write ." scripts.format:check="prettier --check ."`。
6. `@types/node` 的主版本和项目用的 Node.js 主版本对齐（例如 Node 24 用 `npm install -D "@types/node@^24"`）。模板里的版本可能更旧，装 Storybook、Playwright 这类工具时会因此出现 peer 依赖冲突。
7. `npm run format`，再跑一遍自检命令。

## 可选：Storybook

决策点选了 Storybook 时，在组件目录下：

1. `npx -y storybook@latest init --yes --no-dev`
2. 安装器在 Windows 上可能只改了配置、没装上依赖（日志里有 `'wmic' is not recognized`，`node_modules/@storybook` 不存在）：运行 `npm install` 补装。
3. 安装器往 `eslint.config.js` 开头加了一行 ES 模块写法的 `import storybook from "eslint-plugin-storybook";`，而 Angular 生成的这个文件是 CommonJS，ESLint 会报 `require is not defined`：删掉这一行和它上面的注释，在其他 `require` 旁边加 `const storybook = require('eslint-plugin-storybook');`，并在配置数组末尾加 `...storybook.configs['flat/recommended'],`。
4. 在 `tsconfig.app.json` 的 `exclude` 里加 `"src/**/*.stories.ts"`，否则应用构建会把 story 也编译进去。
5. 删掉安装器生成的示例 `src/stories/`。story 从 `@storybook/angular-vite` 导入类型（以安装器生成的版本为准）。
6. 写 story 的约定和 CI 见 scaffold 技能 `shared/visual-testing.md`。

## 可选：视觉回归和端到端测试

决策点选了 Playwright 时，按 scaffold 技能 `shared/visual-testing.md` 配置。启动命令用 `npx ng build && npx http-server dist/<名称>/browser -p 4200 -s`（先 `npm install -D http-server`），端口 4200。

## 自检命令

| 格式化 | lint 和架构检查 | 类型检查 | 测试 | 构建 |
|---|---|---|---|---|
| `npm run format` | `npx ng lint && npm run arch` | 包含在构建里 | `npx ng test --watch=false` | `npx ng build` |

新版 Angular 默认用 Vitest 跑测试。项目用的是 Karma 时，测试命令加 `--browsers=ChromeHeadless`。用了 Storybook 时，构建一栏再加 `npm run build-storybook`。

## 格式化钩子规则

```json
{ "dir": "<目录>", "extensions": [".ts", ".html", ".scss", ".css"], "format": "npx prettier --write {file}", "lint": "npx eslint {file}" }
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
      - run: npx ng lint
      - run: npm run arch
      - run: npx ng test --watch=false
      - run: npx ng build
```

用了 Storybook 时加一步 `npm run build-storybook`；视觉回归测试的 job 见 `shared/visual-testing.md`。

## 版本号

`package.json` 的 `version`：`npm version <版本号> --no-git-tag-version`

## 参考资料

- Angular 官方风格指南：https://angular.dev/style-guide
- angular-eslint：https://github.com/angular-eslint/angular-eslint
- angular-eslint 和 Angular 的版本对应：https://github.com/angular-eslint/angular-eslint/blob/main/docs/ANGULAR_VERSION_SUPPORT.md
- dependency-cruiser 规则写法：https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md
- Storybook for Angular：https://storybook.js.org/docs/get-started/frameworks/angular
- Prettier：https://prettier.io/docs/
