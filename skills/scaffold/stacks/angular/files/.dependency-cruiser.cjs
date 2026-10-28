// 架构规则：页面（容器）和展示组件的分层、功能之间的隔离。说明见 .claude/rules/ 里本组件的规范。
// 由 scripts/arch-check.mjs 运行（npm run arch），违反任何一条，自检和 CI 都会失败。
module.exports = {
  forbidden: [
    {
      name: 'presentational-no-data-access',
      comment: '展示组件只管显示：不依赖 data-access、页面和 core。需要的数据由页面通过 input 传进来。',
      severity: 'error',
      from: { path: '^src/app/(features/[^/]+/components|shared/ui)/' },
      to: { path: '^src/app/(features/[^/]+/(data-access|pages)|core)/', dependencyTypesNot: ['type-only'] },
    },
    {
      name: 'presentational-no-http-or-store',
      comment: '展示组件不调 API、不访问 store。',
      severity: 'error',
      from: { path: '^src/app/(features/[^/]+/components|shared/ui)/' },
      to: { path: '@angular/common/http|@ngrx/' },
    },
    {
      name: 'data-access-no-ui',
      comment: 'data-access 不依赖界面。',
      severity: 'error',
      from: { path: '^src/app/features/[^/]+/data-access/' },
      to: { path: '^src/app/(features/[^/]+/(pages|components)|shared/ui)/' },
    },
    {
      name: 'features-isolated',
      comment: '功能之间不互相引用，几个功能共用的东西放进 shared/。',
      severity: 'error',
      from: { path: '^src/app/features/([^/]+)/' },
      to: { path: '^src/app/features/[^/]+/', pathNot: '^src/app/features/$1/' },
    },
    {
      name: 'shared-and-core-independent',
      comment: 'shared 和 core 不依赖任何功能。',
      severity: 'error',
      from: { path: '^src/app/(shared|core)/' },
      to: { path: '^src/app/features/' },
    },
    {
      name: 'no-circular',
      comment: '不允许循环依赖。',
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
