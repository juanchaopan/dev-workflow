# Visual control: design tokens, Storybook, visual regression tests

Set these up when a frontend component's decision points in /architect chose "component showcase" and "visual regression". Each tool does one job:

| Tool | Job |
|---|---|
| Design tokens | Colors, font sizes, spacing, radius and shadows are defined in one place and code only references the tokens, so the visual style can change and stays aligned |
| Storybook | What each presentational component looks like for each input, checked one by one without running the whole application |
| Visual regression tests (Playwright screenshot comparison) | Whether the look of pages and components changed unexpectedly; if so the PR fails with comparison images |

## Design source

What a screen should look like is defined by one of:

- **Design files**: when the user has design files, they are the reference. Claude can read sizes, colors and spacing from Figma files through Figma's MCP server; see Figma's documentation for how to connect it.
- **/design screen prototypes**: without design files, /design writes an HTML prototype of every state of every screen, renders it to PNG and has the user confirm it screen by screen. The confirmed screenshots (`docs/design/screens/*.png`) are the reference, and the `docs/design/screens/tokens.css` the prototypes share is the source of the design tokens.

Turn colors, font sizes and spacing into design tokens in `src/styles/tokens.(s)css` (CSS custom properties such as `--color-primary` and `--space-2`), with the same names and values as the design files or `tokens.css`. Component styles use only `var(--...)`, never hard-coded colors or pixel values.

## Storybook

The install commands and the fixes each stack needs are in the "Optional: Storybook" section of its `stack.md`. Common conventions:

- Every presentational component has a `<component>.stories.ts(x)` next to it covering at least normal data, empty data, loading, error and very long text.
- Pages (container components) usually have no stories; visual regression tests cover their look.
- Add `npm run build-storybook` to CI so stories always build.

## Visual regression tests

1. Install in the component directory: `npm init playwright@latest -- --quiet --browser=chromium --lang=TypeScript --no-examples`. The installer creates a `tests/` directory and `playwright.config.ts`: delete `tests/`, overwrite the config with the scaffold skill's `shared/playwright.config.ts` and fill in the start command and port as its comments say.
2. Tests live in `e2e/`, one screenshot assertion per key page:

   ```ts
   import { expect, test } from '@playwright/test';

   test('the home page matches the baseline screenshot', async ({ page }) => {
     await page.goto('/');
     await expect(page).toHaveScreenshot('home.png', { fullPage: true });
   });
   ```

3. The unit test runner must exclude `e2e/`, or it picks up the Playwright tests too (Vitest: add `'e2e/**'` to `test.exclude`).
4. Baseline screenshots depend on the operating system (file names contain `-win32` or `-linux`), and font rendering differs slightly between machines, so baselines are generated and compared inside Playwright's official Docker image, which keeps local runs and CI consistent. The image version must match the `@playwright/test` version.

   Give the project its own command for this (an npm script or a script file) and write it into the "Heavy checks" line of CLAUDE.md. The command:

   - reads the image version from the project's locked `@playwright/test` version;
   - keeps the installed dependencies in a cache volume that later runs reuse, so the lock file decides when they are installed again, not every run;
   - takes arguments that update the baselines and that limit the run to some tests (`--grep` or file paths);
   - removes the containers it started, whether the run passed or failed.

   Without such a command, the raw form is:

   ```
   docker run --rm --ipc=host -v "<absolute path of the component directory>:/work" -w /work mcr.microsoft.com/playwright:v<version>-noble \
     sh -c "npm ci && npx playwright test --update-snapshots"
   ```

   In Git Bash on Windows, prefix the command with `MSYS_NO_PATHCONV=1` and convert the path with `cygpath -w`. Commit the generated `e2e/**-snapshots/*.png`.

   This is a heavy check: it goes into the "Heavy checks" line of the project's CLAUDE.md, with what it holds (fixed ports, output directories, containers, roughly how much memory), and leaves nothing running. When `docker info` fails, start Docker first (Docker Desktop: `docker desktop start`). `--rm` removes the container when it exits; anything else the run started (e.g. a `docker compose` stack the tests use) is stopped with `docker compose -f <file> down` afterwards, whether the run passed or failed. When CLAUDE.md says to quit Docker Desktop after heavy checks and the run started it, quit it with `docker desktop stop`.
5. CI runs in the same image:

   ```yaml
     <component>-visual:
       runs-on: ubuntu-latest
       container: mcr.microsoft.com/playwright:v<version>-noble
       defaults:
         run:
           working-directory: <directory>
       steps:
         - uses: actions/checkout@v5
         - run: npm ci
         - run: npx playwright test
         - if: failure()
           uses: actions/upload-artifact@v4
           with:
             name: visual-diff
             path: <directory>/test-results/
   ```

   On failure, download the `visual-diff` artifact: it contains the baseline, the actual image and the diff. Add this job to the `needs` of the `ci` summary job.
6. When the look changed on purpose, regenerate only the baselines of the screens that changed (limit the update with `--grep` or the test files), and compare the rest without updating them. A failure among the rest is either an unexpected change, to fix, or rendering noise, to leave out. Before committing, check with `git status` that every changed baseline belongs to a changed screen, and `git restore` the others. The PR lists which baselines changed and why, and reviewers compare old and new screenshots.

Visual regression baselines and /design prototype screenshots serve different purposes: the prototype screenshot is "what it should look like", confirmed by the user; the baseline is "what it looks like now", used to catch unexpected changes. When implementing a screen, compare against the prototype screenshot first, and generate the baseline once it is right.

## How it fits the workflow

- When /implement builds a screen, it opens the screen in every state the design defines, takes screenshots and puts them side by side with the confirmed prototype screenshots in the PR; for changes to an existing screen it also attaches a screenshot from before the change.
- A PR whose screenshot comparison fails cannot merge: either fix the unexpected change, or confirm it was intended and update the baseline.
