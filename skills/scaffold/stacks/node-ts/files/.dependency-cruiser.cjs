// Architecture rules: routes → services → repositories layering, a domain layer free of frameworks and databases, isolated features.
// Explained in this component's standards in .claude/rules/. Run by scripts/arch-check.mjs (npm run arch); any violation fails the self-check and CI.
// Sources are parsed with SWC (needs @swc/core), not through the TypeScript JS API, so any TypeScript version can be analyzed and
// type-only imports are still recognized.
// SWC does not read tsconfig paths aliases: when aliases are added, configure enhancedResolveOptions.alias under options and
// confirm the architecture check still catches violations.
module.exports = {
  forbidden: [
    {
      name: 'routes-not-imported-by-inner-layers',
      comment: 'routes is the outermost layer; inner layers must not depend on it.',
      severity: 'error',
      from: { path: '/(services|repositories|domain)/' },
      to: { path: '/routes/' },
    },
    {
      name: 'repositories-only-from-services',
      comment: 'Only services call data access; routes must not skip services.',
      severity: 'error',
      from: { path: '/(routes|domain)/' },
      to: { path: '/repositories/' },
    },
    {
      name: 'domain-is-pure',
      comment: 'The domain layer holds only business rules and depends on no other layer, web framework or database driver.',
      severity: 'error',
      from: { path: '/domain/' },
      to: {
        path: '/(routes|services|repositories)/|fastify|express|@nestjs|hono|pg|mysql2|mongodb|mongoose|@prisma|prisma|typeorm|drizzle-orm|kysely',
      },
    },
    {
      name: 'services-not-framework-bound',
      comment: 'services do not depend on the web framework, so business logic can be tested without HTTP.',
      severity: 'error',
      from: { path: '/services/' },
      to: { path: 'fastify|express|@nestjs/platform|hono', dependencyTypesNot: ['type-only'] },
    },
    {
      name: 'features-isolated',
      comment: 'Features do not reference each other; shared code goes to src/shared/.',
      severity: 'error',
      from: { path: '^src/([^/]+)/' },
      to: { path: '^src/[^/]+/', pathNot: ['^src/$1/', '^src/shared/'] },
    },
    {
      name: 'shared-independent',
      comment: 'shared depends on no feature.',
      severity: 'error',
      from: { path: '^src/shared/' },
      to: { path: '^src/[^/]+/', pathNot: '^src/shared/' },
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
    exclude: { path: '[.]test[.]ts$' },
    parser: 'swc',
  },
};
