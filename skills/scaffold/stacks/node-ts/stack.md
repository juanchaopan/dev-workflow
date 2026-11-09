# Node.js (TypeScript)

## How to recognize it

The component directory has `package.json` and `tsconfig.json`, its dependencies include no frontend framework such as react or angular, and the entry point is a server program (e.g. it depends on fastify, express or @nestjs/core).

## Required tools

- The current LTS of Node.js (`node --version`); npm comes with it.

## Decision points

/architect asks each of these once this stack is chosen. The recommended option is what this document does; for another option, configure the equivalent from the tool's official documentation and keep the self-check commands, hook rules and CI consistent.

| Decision | Options | Recommended |
|---|---|---|
| Web framework | Fastify / Express / NestJS / Hono | Fastify: fast, with schema validation and test injection built in; NestJS when the team prefers Angular-style modules and dependency injection |
| Lint | Oxlint (type-aware mode) / typescript-eslint | Oxlint: fast, independent of the TypeScript JS API so any TypeScript release works, and it covers the common type-aware rules (any, unawaited promises, unsafe member access and so on); choose typescript-eslint for rules only it has, but TypeScript is then limited to the versions it supports (see "Versions") |
| Input validation | zod / TypeBox / valibot | zod; TypeBox with Fastify when OpenAPI should be generated directly |
| Data access | Drizzle / Prisma / Kysely / none | Drizzle: close to SQL, type-safe, no extra engine process |
| Package manager | npm / pnpm | npm: nothing extra to install; pnpm for a monorepo with several Node packages |
| Tests | Vitest / Node's built-in node:test | Vitest |

## Versions

Install the latest TypeScript. The architecture check parses sources with SWC, and Oxlint's type-aware mode is built on the Go implementation of TypeScript; neither depends on the TypeScript JS API, so neither limits the TypeScript version.

When lint is typescript-eslint, look up the highest TypeScript version it supports first: `node <scaffold skill directory>/shared/versions.mjs npm typescript typescript-eslint`. When that is older than the latest release (e.g. TypeScript 7.0 ships without a JS API and typescript-eslint waits for the new one), do not decide yourself. Tell the user and let them choose with AskUserQuestion:

- Switch to Oxlint and use the latest TypeScript: the cost is the rules only typescript-eslint has.
- Stay with typescript-eslint and use the version found: the cost is being a major version behind; once typescript-eslint supports the new release, Dependabot's TypeScript toolchain group upgrades them together.

Say what the latest release is, up to which version typescript-eslint supports it, and why (its peerDependencies and release notes). Record the choice in the component's technical details ADR.

NestJS is the exception: its CLI compiles through the TypeScript JS API, so TypeScript follows NestJS. Keep the version the generator installs and do not move to a major NestJS does not support yet.

## Create

**NestJS**: use the official generator:

```
npx -y @nestjs/cli new <name> --directory <directory> --package-manager npm --skip-git --strict
```

The generator brings its own ESLint and typescript-eslint configuration. With Oxlint, uninstall the ESLint packages (`npm uninstall eslint @eslint/js typescript-eslint eslint-config-prettier eslint-plugin-prettier globals`, whichever `package.json` actually has), delete `eslint.config.mjs`, and install Oxlint as in "After creating"; with typescript-eslint, keep the generator's configuration and add the complexity and length rules.

**Fastify, Express, Hono or no framework**: there is no official generator; initialize by hand from the repository root:

```
mkdir -p <directory> && cd <directory>
npm init -y
npm pkg set type=module
npm install -D typescript "@types/node@^<Node.js major>" tsx vitest prettier dependency-cruiser @swc/core
```

Then install the lint tool that was chosen:

- Oxlint: `npm install -D oxlint oxlint-tsgolint`
- typescript-eslint: `npm install -D "typescript@<version from the Versions section>" eslint @eslint/js typescript-eslint`

Then the framework and libraries from the decision points, e.g. `npm install fastify zod`. The `@types/node` major matches the local Node.js major.

## After creating

For hand-initialized projects, in the component directory:

1. Copy `tsconfig.json`, `tsconfig.build.json`, `.prettierrc.json`, `.prettierignore`, `.gitignore` and `.dependency-cruiser.cjs` from `files/`, plus the lint configuration (`.oxlintrc.json` for Oxlint, `eslint.config.mjs` for typescript-eslint), to the component directory, and the scaffold skill's `shared/arch-check.mjs` to the component's `scripts/` directory.
2. Create the layered directories from `rules.md`. The entry point `src/index.ts` assembles and starts everything: starts the server, offers a health endpoint, shuts down gracefully on SIGTERM. Add a smoke test `src/index.test.ts`.
3. `npm pkg set scripts.dev="tsx watch src/index.ts" scripts.build="tsc -p tsconfig.build.json" scripts.start="node dist/index.js" scripts.arch="node scripts/arch-check.mjs" scripts.typecheck="tsc --noEmit" scripts.test="vitest run" scripts.format="prettier --write ." scripts.format:check="prettier --check ."`, and set `scripts.lint` for the chosen lint tool: `oxlint --type-aware --deny-warnings` for Oxlint, `eslint .` for typescript-eslint.
4. `npm run format`, then run the self-check commands once more.

NestJS projects: install `dependency-cruiser` and `@swc/core`, copy `.dependency-cruiser.cjs` and `arch-check.mjs`, switch the rules to file-name suffixes as `rules.md` explains, add the `arch` script. With Oxlint, install `oxlint oxlint-tsgolint`, copy `.oxlintrc.json` and set `scripts.lint` as above; with typescript-eslint, add the complexity and length rules from `files/eslint.config.mjs` to the generated ESLint configuration.

## Self-check commands

| Format | Lint and architecture | Type check | Tests | Build |
|---|---|---|---|---|
| `npm run format` | `npm run lint && npm run arch` | `npm run typecheck` | `npm test` | `npm run build` |

The architecture check fails when it analyzes no modules (e.g. `@swc/core` is not installed) instead of quietly passing.

## Format hook rule

Set `lint` for the chosen lint tool: `npx oxlint --type-aware {file}` for Oxlint, `npx eslint {file}` for typescript-eslint.

```json
{ "dir": "<directory>", "extensions": [".ts"], "format": "npx prettier --write {file}", "lint": "npx oxlint --type-aware {file}" }
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

## Version number

`version` in `package.json`: `npm version <version> --no-git-tag-version`

## References

- Oxlint type-aware mode: https://oxc.rs/docs/guide/usage/linter/type-aware
- typescript-eslint: https://typescript-eslint.io/
- dependency-cruiser rules: https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md
- Node.js documentation: https://nodejs.org/docs/latest/api/
- TypeScript tsconfig options: https://www.typescriptlang.org/tsconfig/
