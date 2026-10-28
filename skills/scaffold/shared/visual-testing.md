# 视觉控制：设计令牌、Storybook、视觉回归测试

前端组件在 /architect 的决策点里选了"组件展示"和"视觉回归"时，按本文配置。三样东西各管一件事：

| 工具 | 管什么 |
|---|---|
| 设计令牌 | 颜色、字号、间距、圆角、阴影只在一处定义，代码里只引用令牌，视觉风格才改得动、对得齐 |
| Storybook | 每个展示组件在各种输入下长什么样，单独看、单独检查，不用跑整个应用 |
| 视觉回归测试（Playwright 截图对比） | 页面和组件的外观有没有被意外改变；变了就在 PR 里失败，并给出对比图 |

## 设计来源

- 有设计稿时，设计稿是标准答案。Figma 设计稿可以通过 Figma 的 MCP 服务让 Claude 直接读取尺寸、颜色和间距；连接方法见 Figma 官方文档。
- 设计稿里的颜色、字号、间距整理成设计令牌，放在 `src/styles/tokens.(s)css`（CSS 自定义属性，例如 `--color-primary`、`--space-2`）。组件样式里只用 `var(--...)`，不写死颜色值和像素值。
- 没有设计稿时，先用 Storybook 把关键组件做出来给用户看，确认后再接到页面上。

## Storybook

各技术栈的安装命令和要修的地方见各自 `stack.md` 的"可选：Storybook"一节。共同的约定：

- 每个展示组件旁边放一个 `<组件>.stories.ts(x)`，至少覆盖：正常数据、空数据、加载中、出错、超长文字。
- 页面（容器组件）一般不写 story；它们的外观由视觉回归测试覆盖。
- `npm run build-storybook` 加进 CI，保证 story 一直能构建。

## 视觉回归测试

1. 在组件目录下安装：`npm init playwright@latest -- --quiet --browser=chromium --lang=TypeScript --no-examples`。安装器会生成 `tests/` 目录和 `playwright.config.ts`：删掉 `tests/`，把 scaffold 技能 `shared/playwright.config.ts` 复制过来覆盖，按里面的注释填好启动命令和端口。
2. 测试写在 `e2e/` 下，每个关键页面一个截图断言：

   ```ts
   import { expect, test } from '@playwright/test';

   test('首页的外观和基准截图一致', async ({ page }) => {
     await page.goto('/');
     await expect(page).toHaveScreenshot('home.png', { fullPage: true });
   });
   ```

3. 单元测试工具要排除 `e2e/`，否则它会把 Playwright 的测试也拿去跑（Vitest：`test.exclude` 里加上 `'e2e/**'`）。
4. 基准截图和操作系统有关（文件名里带 `-win32`、`-linux`），而且字体渲染在不同机器上会有细微差别，所以基准截图统一在 Playwright 官方的 Docker 镜像里生成和比对，本地和 CI 结果才一致。镜像的版本号要和 `@playwright/test` 的版本一致：

   ```
   docker run --rm --ipc=host -v "<组件目录的绝对路径>:/work" -w /work mcr.microsoft.com/playwright:v<版本号>-noble \
     sh -c "npm ci && npx playwright test --update-snapshots"
   ```

   Windows 的 Git Bash 里，命令前加 `MSYS_NO_PATHCONV=1`，路径用 `cygpath -w` 转换。生成的 `e2e/**-snapshots/*.png` 提交进仓库。需要 Docker Desktop 正在运行。
5. CI 里用同一个镜像跑：

   ```yaml
     <组件>-visual:
       runs-on: ubuntu-latest
       container: mcr.microsoft.com/playwright:v<版本号>-noble
       defaults:
         run:
           working-directory: <目录>
       steps:
         - uses: actions/checkout@v5
         - run: npm ci
         - run: npx playwright test
         - if: failure()
           uses: actions/upload-artifact@v4
           with:
             name: visual-diff
             path: <目录>/test-results/
   ```

   失败时下载 `visual-diff` 产物，里面有基准图、实际图和差异图。这个 job 加进 `ci` 汇总 job 的 `needs`。
6. 外观是有意改的：重新生成基准截图（第 4 步），和代码一起提交。PR 里写明哪些页面的外观变了，审查时对照新旧截图确认。

## 和流程的衔接

- /implement 改了界面时，在 PR 里附上改动前后的截图。
- 截图对比失败的 PR 不能合并：要么修好意外的改动，要么确认是有意的并更新基准。
