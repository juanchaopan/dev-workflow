// Architecture rules: pages (containers) versus presentational components, isolated features. Explained in this component's standards in .claude/rules/.
// Run by scripts/arch-check.mjs (npm run arch); any violation fails the self-check and CI.
// Sources are parsed with SWC (needs @swc/core), not through the TypeScript JS API, so any TypeScript version can be analyzed and
// type-only imports are still recognized.
// SWC does not read tsconfig paths aliases: when aliases are added (e.g. @/), configure enhancedResolveOptions.alias under options and
// confirm the architecture check still catches violations.
module.exports = {
  forbidden: [
    {
      name: 'presentational-no-data-access',
      comment: 'Presentational components only render: they do not depend on data-access, pages or the app layer. Pages pass data in through props.',
      severity: 'error',
      from: { path: '^src/(features/[^/]+/components|shared/ui)/' },
      to: { path: '^src/(features/[^/]+/(data-access|pages)|app)/', dependencyTypesNot: ['type-only'] },
    },
    {
      name: 'presentational-no-data-libraries',
      comment: 'Presentational components neither fetch data nor touch global state.',
      severity: 'error',
      from: { path: '^src/(features/[^/]+/components|shared/ui)/' },
      to: { path: '@tanstack/react-query|axios|swr|zustand|@reduxjs/toolkit|react-redux|jotai' },
    },
    {
      name: 'data-access-no-ui',
      comment: 'data-access does not depend on UI.',
      severity: 'error',
      from: { path: '^src/features/[^/]+/data-access/' },
      to: { path: '^src/(features/[^/]+/(pages|components)|shared/ui)/' },
    },
    {
      name: 'features-isolated',
      comment: 'Features do not reference each other; what several features share goes to shared/.',
      severity: 'error',
      from: { path: '^src/features/([^/]+)/' },
      to: { path: '^src/features/[^/]+/', pathNot: '^src/features/$1/' },
    },
    {
      name: 'shared-independent',
      comment: 'shared depends on no feature.',
      severity: 'error',
      from: { path: '^src/shared/' },
      to: { path: '^src/features/' },
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
    exclude: { path: '[.]test[.]tsx?$' },
    parser: 'swc',
  },
};
