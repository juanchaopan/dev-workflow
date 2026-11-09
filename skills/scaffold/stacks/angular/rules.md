---
paths:
  - "{{component directory}}/**"
---

# Angular standards: {{component name}}

Sources: the Angular style guide (https://angular.dev/style-guide) and the common container / presentational (smart / dumb) component layering. Prettier and angular-eslint handle formatting and the rules that can be checked automatically; dependency-cruiser (`.dependency-cruiser.cjs`, `npm run arch`) checks layering. This file covers what needs judgment.

## Layers: pages and presentational components

```
src/app/
├── core/                  global singleton services, HTTP interceptors, guards
├── shared/ui/             presentational components shared by features
├── shared/util/           pure functions, pipes
└── features/<feature>/
    ├── pages/             pages: what routes point to
    ├── components/        presentational components
    ├── data-access/       API clients, stores, state services
    └── models/            type definitions
```

**Pages (container components)** decide where data comes from and where it goes:

- Inject data-access services or stores, call APIs, and handle loading, errors and empty data.
- Hold state (signals or a store), pass data to children through property bindings and update state through their events; use `model()` two-way binding when parent and child must keep one value in sync.
- Handle navigation and route parameters.
- Keep their own styles and templates minimal; presentational components do the layout.

**Presentational components** decide only what things look like:

- Stateless: data comes in only through `input()` and changes go out only through `output()` or `model()`. Internal state is limited to pure UI state such as expanded, collapsed or hovered.
- They inject no services, call no APIs, and touch neither stores nor routing state. Whatever data they need, the page passes in.
- They set `changeDetection: ChangeDetectionStrategy.OnPush`.
- Given inputs, they render on their own, so they can be shown in Storybook and tested in isolation.

Dependency rules enforced by `npm run arch`:

- Presentational components (`components/`, `shared/ui/`) do not depend on data-access, pages or core, and do not reference `HttpClient` or NgRx; types from models are fine.
- data-access does not depend on UI.
- Features do not reference each other; what several features share moves to `shared/`.
- shared and core depend on no feature.
- No circular dependencies.

## Writing components

- Standalone components only; no new NgModules.
- Create components, services and guards with `ng generate` and keep the file names the CLI produces. One component or service per file.
- Inputs and outputs use `input()`, `output()` and `model()`, not the `@Input` and `@Output` decorators.
- Dependency injection uses `inject()`.
- Templates use the built-in control flow `@if`, `@for` (always with `track`) and `@switch`, not `*ngIf` and `*ngFor`.
- No complex expressions or function calls in templates; derived values use `computed()`.

## State and data

- Component state uses signals; state shared across components lives in data-access services or stores.
- RxJS is for asynchronous event streams (HTTP, WebSocket, debounced input). Subscriptions are managed with the `async` pipe, `toSignal()` or `takeUntilDestroyed()`; no subscription is left uncancelled.
- HTTP is called only in data-access; API data is described with types from models, never `any`.
- Forms are typed reactive forms with validation rules in the form definition.

## Routing and permissions

- Pages are lazy-loaded (`loadComponent`, `loadChildren`).
- Route guards are functional guards. Frontend permission checks are only for the experience; real authorization happens in the backend.

## Styles

- Colors, font sizes, spacing and radius come from design tokens (`var(--...)`), never hard-coded colors or pixel values.
- A presentational component's styles apply only to itself, never overriding child components or global styles.

## Quality

- Every interactive element works with the keyboard, images have alt text, form controls have labels.
- Text users see is managed in one place, ready for translation later.
- Tests: data-access for data logic; presentational components for "given these inputs, what shows and which event a click emits"; pages for how they work with data-access.
- No `console.log` in production code.
