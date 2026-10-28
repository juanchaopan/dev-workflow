# Angular（TypeScript）

## 识别方法

组件目录里有 `angular.json`。

## 需要的工具

- Node.js 当前的 LTS 版本（`node --version`），npm 随 Node.js 一起安装。
- 每个大版本的 Angular CLI 都要求最低的 Node.js 小版本。CLI 报 "requires a minimum Node.js version" 时，告诉用户两个办法：升级 Node.js；或者用上一个大版本的 CLI，把下面命令里的 `@latest` 换成 `@<主版本号>`。不要自己升级系统里的 Node.js。

## 创建命令

在仓库根目录运行，`<名称>` 是组件名，`<目录>` 是组件目录（例如 `apps/web`）：

```
NG_CLI_ANALYTICS=false npx -y @angular/cli@latest new <名称> --directory <目录> --defaults --routing --style=scss --ssr=false --skip-git --ai-config=none
```

- `--skip-git`：仓库由上层统一管理。
- 架构需要服务端渲染时，去掉 `--ssr=false`。
- CLI 不认识 `--ai-config` 时去掉这个参数。
- 安装依赖时 npm 报 `Cannot read properties of null (reading 'edgesOut')`，是部分 npm 11 版本在处理 peer 依赖时的已知问题：在组件目录下运行 `npm install --legacy-peer-deps` 补装依赖；后面的 `ng add` 也会触发同样的问题，就在组件目录建一个 `.npmrc`，写入 `legacy-peer-deps=true`，并告诉用户升级 npm（`npm install -g npm@latest`）可以根治。

## 创建后

在组件目录下：

1. 查项目的 Angular 主版本号（`package.json` 里 `@angular/core` 的版本），装同一主版本的 angular-eslint：`NG_CLI_ANALYTICS=false npx ng add angular-eslint@<主版本号> --skip-confirmation`。它会生成 `eslint.config.js`，并在 `angular.json` 里配好 `ng lint`。如果输出里提示版本不匹配、没有生成 `eslint.config.js`，再运行一次同样的命令。
2. `npm install -D prettier`
3. 把 `files/` 下的 `.prettierrc.json`、`.prettierignore` 复制到组件目录。
4. `npm pkg set scripts.format="prettier --write ." scripts.format:check="prettier --check ."`
5. `npm run format`，把生成的代码统一格式化一遍。

## 自检命令

| 格式化 | lint | 类型检查 | 测试 | 构建 |
|---|---|---|---|---|
| `npm run format` | `npx ng lint` | 包含在构建里 | `npx ng test --watch=false` | `npx ng build` |

新版 Angular 默认用 Vitest 跑测试。项目用的是 Karma 时，测试命令加 `--browsers=ChromeHeadless`。

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
      - run: npx ng test --watch=false
      - run: npx ng build
```

## 版本号

`package.json` 的 `version`：`npm version <版本号> --no-git-tag-version`

## 参考资料

- Angular 官方风格指南：https://angular.dev/style-guide
- angular-eslint：https://github.com/angular-eslint/angular-eslint
- angular-eslint 和 Angular 的版本对应：https://github.com/angular-eslint/angular-eslint/blob/main/docs/ANGULAR_VERSION_SUPPORT.md
- Prettier：https://prettier.io/docs/
