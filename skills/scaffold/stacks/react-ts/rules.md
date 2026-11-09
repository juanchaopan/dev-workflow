---
paths:
  - "{{component directory}}/**"
---

# React standards: {{component name}}

Sources: the React documentation (https://react.dev/learn) and the common container / presentational component layering. Prettier handles formatting; the template's linter (oxlint or ESLint) checks the Hooks rules and complexity and length limits; TypeScript checks types; dependency-cruiser (`.dependency-cruiser.cjs`, `npm run arch`) checks layering. This file covers what needs judgment.

## Layers: pages and presentational components

```
src/
├── app/                   application shell: routes, global providers, layout
├── shared/ui/             presentational components shared by features
├── shared/lib/            pure functions, generic hooks
└── features/<feature>/
    ├── pages/             pages: what routes point to
    ├── components/        presentational components
    ├── data-access/       API calls, server-state hooks (e.g. useOrders), stores
    └── model.ts           type definitions (or exported as types from data-access)
```

**Pages (container components)** decide where data comes from and where it goes:

- Call data-access hooks to fetch data and submit changes, and handle loading, errors and empty data.
- Hold page state, pass it to children through props and update it through their callbacks (`onSelect`, `onChange`); controlled components keep in sync with `value` plus `onChange`.
- Handle navigation and route parameters.

**Presentational components** decide only what things look like:

- Stateless: data comes in only through props and changes go out only through callback props. Internal state is limited to pure UI state such as expanded, collapsed or hovered.
- They do not fetch data, call APIs, or touch global or routing state. Whatever data they need, the page passes in.
- Given props, they render on their own, so they can be shown in Storybook and tested in isolation.

Dependency rules enforced by `npm run arch`:

- Presentational components (`components/`, `shared/ui/`) do not depend on data-access, pages or app, and do not import data-fetching or global-state libraries such as TanStack Query, axios, SWR, Zustand or Redux; `import type` for types is allowed.
- data-access does not depend on UI.
- Features do not reference each other; what several features share moves to `shared/`. shared depends on no feature.
- No circular dependencies.

## Writing components

- Function components only. Props are described with TypeScript types, never `any`.
- Component files are PascalCase (`OrderList.tsx`); hook files are `useXxx.ts`.
- Split a component that is too long or does several things; lint checks function length and complexity limits.
- List keys are stable business IDs, never array indexes.

## State

- State lives in the nearest component that uses it; lift it up, or into context or a state library, only when several components share it.
- Server data is managed by a dedicated library (e.g. TanStack Query), wrapped in data-access hooks, not hand-built from useEffect and useState.
- Values that can be computed from existing state are computed, not stored again.
- useEffect only synchronizes with external systems (subscriptions, the DOM, timers) and has a cleanup function; never use it to respond to user actions or derive state.

## Data and security

- API calls live in data-access, with errors and authentication handled in one place.
- Never render user input with `dangerouslySetInnerHTML`.
- Variables in `import.meta.env` are bundled into the frontend: public configuration only, never secrets.

## Styles

- Colors, font sizes, spacing and radius come from design tokens (CSS custom properties, `var(--...)`), never hard-coded colors or pixel values.
- A presentational component's styles apply only to itself (CSS Modules or the chosen styling's scoping), never overriding child components or global styles.

## Quality

- Interactive elements use semantic tags (button, a, label) and work with the keyboard.
- Loading, error and empty states all have a UI.
- Tests use Testing Library and find elements the way users see them (role, label, text), not internal state. Presentational components are tested for "given these props, what shows and which callback a click calls"; pages for how they work with data-access.
- No `console.log` in production code.
