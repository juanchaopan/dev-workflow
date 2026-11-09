// Architecture rules: pages (containers) versus presentational components, isolated features. Explained in this component's standards in .claude/rules/.
// Run by scripts/arch-check.mjs (npm run arch); any violation fails the self-check and CI.
// Sources are parsed through the TypeScript version Angular installs, which also resolves the tsconfig paths.
module.exports = {
  forbidden: [
    {
      name: 'presentational-no-data-access',
      comment: 'Presentational components only render: they do not depend on data-access, pages or core. Pages pass data in through inputs.',
      severity: 'error',
      from: { path: '^src/app/(features/[^/]+/components|shared/ui)/' },
      to: { path: '^src/app/(features/[^/]+/(data-access|pages)|core)/', dependencyTypesNot: ['type-only'] },
    },
    {
      name: 'presentational-no-http-or-store',
      comment: 'Presentational components neither call APIs nor touch stores.',
      severity: 'error',
      from: { path: '^src/app/(features/[^/]+/components|shared/ui)/' },
      to: { path: '@angular/common/http|@ngrx/' },
    },
    {
      name: 'data-access-no-ui',
      comment: 'data-access does not depend on UI.',
      severity: 'error',
      from: { path: '^src/app/features/[^/]+/data-access/' },
      to: { path: '^src/app/(features/[^/]+/(pages|components)|shared/ui)/' },
    },
    {
      name: 'features-isolated',
      comment: 'Features do not reference each other; what several features share goes to shared/.',
      severity: 'error',
      from: { path: '^src/app/features/([^/]+)/' },
      to: { path: '^src/app/features/[^/]+/', pathNot: '^src/app/features/$1/' },
    },
    {
      name: 'shared-and-core-independent',
      comment: 'shared and core depend on no feature.',
      severity: 'error',
      from: { path: '^src/app/(shared|core)/' },
      to: { path: '^src/app/features/' },
    },
    {
      name: 'no-circular',
      comment: 'No circular dependencies.',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '[.]spec[.]ts$' },
    tsConfig: { fileName: 'tsconfig.json' },
    tsPreCompilationDeps: true,
  },
};
