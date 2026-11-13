# Angular (TypeScript)

## How to recognize it

The component directory has an `angular.json`.

## Required tools

- The current LTS of Node.js (`node --version`); npm comes with it.
- Each Angular CLI major requires a minimum Node.js minor. When the CLI reports "requires a minimum Node.js version", tell the user the two options: upgrade Node.js, or use the previous CLI major by replacing `@latest` in the command below with `@<major>`. Never upgrade the system's Node.js yourself.

## Decision points

/architect asks each of these once this stack is chosen. The recommended option is what this document does; for another option, configure the equivalent from the tool's official documentation and keep the self-check commands, hook rules and CI consistent.

| Decision | Options | Recommended |
|---|---|---|
| Component layering | Pages plus presentational components (see rules.md) / none | Pages plus presentational components |
| State management | Signals and services / NgRx SignalStore / NgRx Store | Signals and services; NgRx SignalStore when there is a lot of state shared across pages |
| Styling | SCSS / CSS / Tailwind CSS | SCSS with design tokens |
| Component library | None / Angular Material / PrimeNG | None with design files, built to the design; Angular Material to build admin-style UIs fast |
| Unit tests | Vitest (CLI default) / Karma with Jasmine | Vitest |
| Component showcase | Storybook / none | Storybook, when there are many presentational components and the look matters |
| Visual regression and end-to-end tests | Playwright / none | Playwright, when the look matters and there are key flows |
| Server-side rendering | None / SSR | None; SSR when search engine indexing or a very fast first screen is needed |

## Versions

Use the latest Angular CLI. TypeScript follows Angular: keep the version the CLI installs and let `ng update` move it with Angular; do not upgrade it separately (Angular declares the TypeScript range it supports). angular-eslint uses the same major as Angular.

## Create

From the repository root, where `<name>` is the component name and `<directory>` the component directory (e.g. `apps/web`):

```
NG_CLI_ANALYTICS=false npx -y @angular/cli@latest new <name> --directory <directory> --defaults --routing --style=scss --ssr=false --skip-git --ai-config=none
```

- `--skip-git`: the repository is managed one level up.
- Drop `--ssr=false` when SSR was chosen; change `--style` for other styling.
- Drop `--ai-config` when the CLI does not recognize it.
- When npm reports `Cannot read properties of null (reading 'edgesOut')` while installing dependencies, that is a known peer dependency problem in some npm 11 releases: run `npm install --legacy-peer-deps` in the component directory to finish the install; later `ng add` commands hit the same problem, so create a `.npmrc` in the component directory with `legacy-peer-deps=true`, and tell the user that upgrading npm (`npm install -g npm@latest`) fixes it for good.

## After creating

In the component directory:

1. Find the project's Angular major (the `@angular/core` version in `package.json`) and install angular-eslint of the same major: `NG_CLI_ANALYTICS=false npx ng add angular-eslint@<major> --skip-confirmation`. It creates `eslint.config.js` and configures `ng lint` in `angular.json`. If the output mentions a version mismatch and no `eslint.config.js` appears, run the same command again.
2. Add complexity and length limits at the end of the configuration array in `eslint.config.js`:

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

3. Architecture check: `npm install -D dependency-cruiser`; copy `files/.dependency-cruiser.cjs` to the component directory and the scaffold skill's `shared/arch-check.mjs` to the component's `scripts/` directory; `npm pkg set scripts.arch="node scripts/arch-check.mjs"`.
4. Create the directories from `rules.md`: `src/app/core/`, `src/app/shared/ui/`, `src/app/shared/util/`, and for the first feature `src/app/features/<feature>/{pages,components,data-access,models}/`. Put a `.gitkeep` in empty directories.
5. `npm install -D prettier`, copy `.prettierrc.json` and `.prettierignore` from `files/` to the component directory, `npm pkg set scripts.format="prettier --write ." scripts.format:check="prettier --check ."`.
6. `@types/node` follows the project's Node.js major (e.g. `npm install -D "@types/node@^24"` for Node 24). The template's version may be older, which causes peer dependency conflicts when installing tools such as Storybook or Playwright.
7. `npm run format`, then run the self-check commands once more.

## Optional: Storybook

When the decision points chose Storybook, in the component directory:

1. `npx -y storybook@latest init --yes --no-dev`
2. On Windows the installer may change the configuration without installing the dependencies (the log shows `'wmic' is not recognized` and `node_modules/@storybook` does not exist): run `npm install` to finish.
3. The installer adds an ES module line `import storybook from "eslint-plugin-storybook";` at the top of `eslint.config.js`, but the file Angular generates is CommonJS, so ESLint reports `require is not defined`: delete that line and the comment above it, add `const storybook = require('eslint-plugin-storybook');` next to the other `require` calls, and add `...storybook.configs['flat/recommended'],` at the end of the configuration array.
4. Add `"src/**/*.stories.ts"` to `exclude` in `tsconfig.app.json`, or the application build compiles the stories too.
5. Delete the example `src/stories/` the installer creates. Stories import their types from `@storybook/angular-vite` (follow the version the installer generates).
6. Story conventions and CI are in the scaffold skill's `shared/visual-testing.md`.

## Optional: visual regression and end-to-end tests

When the decision points chose Playwright, configure it from the scaffold skill's `shared/visual-testing.md`. The start command, written as a template string in `playwright.config.ts`, is `npx ng build && npx http-server dist/<name>/browser -p ${port} -s` (after `npm install -D http-server`); the default port is 4200 and `E2E_PORT` overrides it.

## Self-check commands

| Format | Lint and architecture | Type check | Tests | Build |
|---|---|---|---|---|
| `npm run format` | `npx ng lint && npm run arch` | part of the build | `npx ng test --watch=false` | `npx ng build` |

Recent Angular runs tests with Vitest. When the project uses Karma, add `--browsers=ChromeHeadless` to the test command. With Storybook, the build column adds `npm run build-storybook`.

## Format hook rule

```json
{ "dir": "<directory>", "extensions": [".ts", ".html", ".scss", ".css"], "format": "npx prettier --write {file}", "lint": "npx eslint {file}" }
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
      - run: npx ng lint
      - run: npm run arch
      - run: npx ng test --watch=false
      - run: npx ng build
```

With Storybook, add a `npm run build-storybook` step; the visual regression job is in `shared/visual-testing.md`.

## Version number

`version` in `package.json`: `npm version <version> --no-git-tag-version`

## References

- Angular style guide: https://angular.dev/style-guide
- angular-eslint: https://github.com/angular-eslint/angular-eslint
- angular-eslint and Angular version support: https://github.com/angular-eslint/angular-eslint/blob/main/docs/ANGULAR_VERSION_SUPPORT.md
- dependency-cruiser rules: https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md
- Storybook for Angular: https://storybook.js.org/docs/get-started/frameworks/angular
- Prettier: https://prettier.io/docs/
