# React (TypeScript, Vite)

## How to recognize it

The component's `package.json` depends on `react` and there is a `vite.config.ts` (or `.js`).

## Required tools

- The current LTS of Node.js (`node --version`); npm comes with it.

## Decision points

/architect asks each of these once this stack is chosen. The recommended option is what this document does; for another option, configure the equivalent from the tool's official documentation and keep the self-check commands, hook rules and CI consistent.

| Decision | Options | Recommended |
|---|---|---|
| Framework | Vite single-page app / Next.js / React Router framework mode | Vite single-page app; Next.js when server-side rendering or search engine indexing is needed (its directory structure differs from this document; follow its documentation) |
| Component layering | Pages plus presentational components (see rules.md) / none | Pages plus presentational components |
| Routing | React Router / TanStack Router | React Router |
| Server state | TanStack Query / SWR | TanStack Query |
| Global state | None / Zustand / Redux Toolkit | None; Zustand when there really is client state shared across pages |
| Styling | CSS Modules / Tailwind CSS / CSS-in-JS | CSS Modules with design tokens |
| Component library | None / MUI / Ant Design / shadcn/ui | None with design files, or one whose source you own such as shadcn/ui; Ant Design or MUI to build admin-style UIs fast |
| Component showcase | Storybook / none | Storybook, when there are many presentational components and the look matters |
| Visual regression and end-to-end tests | Playwright / none | Playwright, when the look matters and there are key flows |

## Versions

TypeScript is the version the template installs (the latest release); do not change it. The architecture check parses sources with SWC and the template's oxlint does not depend on the TypeScript JS API, so neither limits the TypeScript version. When an older template's linter is ESLint with typescript-eslint, look up the versions typescript-eslint supports as in the "Versions" section of the Node.js stack's stack.md; when that is older than the latest release, tell the user and let them choose (switch to oxlint, or use the version found).

## Create

From the repository root:

```
npm create vite@latest <directory> -- --template react-ts --no-interactive
cd <directory> && npm install
```

Drop `--no-interactive` when create-vite does not recognize it.

The template ships a linter and its configuration; keep it: newer templates use oxlint (`.oxlintrc.json`, React Hooks rules enabled), older ones ESLint (`eslint.config.js`). Below, "the template's linter" means whichever tool the template's `lint` script runs.

## After creating

In the component directory:

1. `@types/node` follows the project's Node.js major (e.g. `npm install -D "@types/node@^24"` for Node 24); otherwise installing tools such as Storybook runs into peer dependency conflicts.
2. Add complexity and length limits to the template linter's configuration. React components have long JSX, so the function length limit is 100 lines. For oxlint, in the `rules` of `.oxlintrc.json`:

   ```json
   "eslint/complexity": ["error", 10],
   "eslint/max-depth": ["error", 3],
   "eslint/max-lines-per-function": ["error", { "max": 100, "skipBlankLines": true, "skipComments": true }]
   ```

   and add `"ignorePatterns": ["**/*.test.ts", "**/*.test.tsx", "**/*.stories.tsx", ".dependency-cruiser.cjs"]`. With ESLint, add the same three rules to `eslint.config.js` (without the `eslint/` prefix).
3. Architecture check: `npm install -D dependency-cruiser @swc/core`; copy `files/.dependency-cruiser.cjs` to the component directory and the scaffold skill's `shared/arch-check.mjs` to the component's `scripts/` directory; `npm pkg set scripts.arch="node scripts/arch-check.mjs"`.
4. Unit tests: `npm install -D prettier vitest jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom @testing-library/user-event`; copy `.prettierrc.json`, `.prettierignore` and `src/test/setup.ts` from `files/` to the same places. Add `/// <reference types="vitest/config" />` as the first line of `vite.config.ts` and add to `defineConfig`:

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

   The `projects` form lets Storybook later add its tests as a second project next to this one; `include` only takes tests under `src/`, so Vitest never picks up the Playwright tests in `e2e/`.
5. `npm pkg set scripts.test="vitest run" scripts.typecheck="tsc -b" scripts.format="prettier --write ." scripts.format:check="prettier --check ."`
6. The template's `App.tsx` is a demo page: replace it with the application shell (routes and layout, in `src/app/`) and create the directories from `rules.md`: `src/shared/ui/`, `src/shared/lib/`, `src/features/<first feature>/{pages,components,data-access}/`. Write a smoke test that renders the shell and asserts on visible content.
7. `npm run format`, then run the self-check commands once more.

## Optional: Storybook

When the decision points chose Storybook, in the component directory:

1. `npx -y storybook@latest init --yes --no-dev`. Afterwards check that `node_modules/@storybook` exists; run `npm install` when it does not.
2. The installer changes `vite.config.ts`, adding a project named `storybook` to `test.projects` (it runs every story in a browser). Make sure the `unit` project from step 4 is still there, side by side.
3. Delete the example `src/stories/` the installer creates: it fails this project's lint and type check.
4. Stories import their types from `@storybook/react-vite` (follow the `.storybook/main.ts` the installer generates). Story conventions and CI are in the scaffold skill's `shared/visual-testing.md`.

## Optional: visual regression and end-to-end tests

When the decision points chose Playwright, configure it from the scaffold skill's `shared/visual-testing.md`. The start command is `npm run build && npx vite preview --port 4173 --strictPort`, on port 4173.

## Self-check commands

| Format | Lint and architecture | Type check | Tests | Build |
|---|---|---|---|---|
| `npm run format` | `npm run lint && npm run arch` | `npm run typecheck` | `npm test` | `npm run build` |

With Storybook, `npm test` also runs every story in a browser, and the build column adds `npm run build-storybook`.

## Format hook rule

`lint` is the template's linter: `npx oxlint {file}` for oxlint, `npx eslint {file}` for ESLint.

```json
{ "dir": "<directory>", "extensions": [".ts", ".tsx", ".css"], "format": "npx prettier --write {file}", "lint": "npx oxlint {file}" }
```

## CI steps

```yaml
  <component>:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: <directory>
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: lts/*
          cache: npm
          cache-dependency-path: <directory>/package-lock.json
      - run: npm ci
      - run: npm run format:check
      - run: npm run lint
      - run: npm run arch
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
```

With Storybook, add `npx playwright install --with-deps chromium` before `npm test` (story tests run in a browser) and a `npm run build-storybook` step; the visual regression job is in `shared/visual-testing.md`.

## Version number

`version` in `package.json`: `npm version <version> --no-git-tag-version`

## References

- React documentation: https://react.dev/learn
- You might not need an Effect: https://react.dev/learn/you-might-not-need-an-effect
- oxlint: https://oxc.rs/docs/guide/usage/linter
- dependency-cruiser rules: https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md
- Storybook for React: https://storybook.js.org/docs/get-started/frameworks/react-vite
- Testing Library: https://testing-library.com/docs/react-testing-library/intro/
