#!/usr/bin/env bash
# Node.js smoke test: initializes a project by hand following stacks/node-ts/stack.md, installs the standards, runs the self-check
# commands, then confirms the layering rules and the type-aware lint catch violations.
# LINT=oxlint (default, latest TypeScript) or LINT=eslint (typescript-eslint, the highest TypeScript it supports).
source "$(dirname "$0")/lib.sh"
F="$STACKS/node-ts/files"
LINT=${LINT:-oxlint}

case "$LINT" in
  oxlint)
    TS=latest
    LINT_PACKAGES=(oxlint oxlint-tsgolint)
    LINT_CONFIG=.oxlintrc.json
    LINT_SCRIPT="oxlint --type-aware --deny-warnings"
    LINT_FILE=(npx oxlint --type-aware --deny-warnings)
    ;;
  eslint)
    TS=$(npm_compatible typescript typescript-eslint)
    LINT_PACKAGES=(eslint @eslint/js typescript-eslint)
    LINT_CONFIG=eslint.config.mjs
    LINT_SCRIPT="eslint ."
    LINT_FILE=(npx eslint)
    ;;
  *) die "LINT must be oxlint or eslint" ;;
esac

step "Create the project ($LINT)"
mkdir -p "$WORK/app" && cd "$WORK/app"
npm init -y
npm pkg set type=module
npm install -D "typescript@$TS" "@types/node@^$(node_major)" tsx vitest prettier dependency-cruiser @swc/core "${LINT_PACKAGES[@]}"
TS_VERSION=$(npx tsc --version)
echo "$TS_VERSION"

step "Install the standards"
cp "$F/tsconfig.json" "$F/tsconfig.build.json" "$F/$LINT_CONFIG" "$F/.prettierrc.json" "$F/.prettierignore" "$F/.gitignore" "$F/.dependency-cruiser.cjs" .
mkdir -p scripts && cp "$SHARED/arch-check.mjs" scripts/
npm pkg set scripts.build="tsc -p tsconfig.build.json" scripts.lint="$LINT_SCRIPT" scripts.arch="node scripts/arch-check.mjs" \
  scripts.typecheck="tsc --noEmit" scripts.test="vitest run" scripts.format="prettier --write ." scripts.format:check="prettier --check ."

step "Layered directories and sample code"
mkdir -p src/orders/routes src/orders/services src/orders/repositories src/orders/domain src/shared
cat > src/orders/domain/order.ts <<'EOF'
export interface Order {
  id: number;
  title: string;
}
EOF
cat > src/orders/repositories/order-repository.ts <<'EOF'
import type { Order } from '../domain/order.js';

const orders: Order[] = [{ id: 1, title: 'First order' }];

export function findAll(): Order[] {
  return orders;
}
EOF
cat > src/orders/services/order-service.ts <<'EOF'
import type { Order } from '../domain/order.js';
import { findAll } from '../repositories/order-repository.js';

export function listOrders(): Order[] {
  return findAll();
}
EOF
cat > src/orders/routes/order-routes.ts <<'EOF'
import type { IncomingMessage, ServerResponse } from 'node:http';
import { listOrders } from '../services/order-service.js';

export function handleOrders(_request: IncomingMessage, response: ServerResponse): void {
  response.writeHead(200, { 'content-type': 'application/json' });
  response.end(JSON.stringify(listOrders()));
}
EOF
cat > src/index.ts <<'EOF'
import { createServer } from 'node:http';
import { handleOrders } from './orders/routes/order-routes.js';

export const server = createServer((request, response) => {
  if (request.url === '/health') {
    response.writeHead(200).end('ok');
    return;
  }
  if (request.url === '/orders') {
    handleOrders(request, response);
    return;
  }
  response.writeHead(404).end();
});

if (process.env.NODE_ENV !== 'test') {
  server.listen(Number(process.env.PORT ?? 3000));
  process.on('SIGTERM', () => {
    server.close(() => process.exit(0));
  });
}
EOF
cat > src/orders/services/order-service.test.ts <<'EOF'
import { describe, expect, it } from 'vitest';
import { listOrders } from './order-service.js';

describe('listOrders', () => {
  it('returns every order', () => {
    expect(listOrders()).toHaveLength(1);
  });
});
EOF
npm run format

step "Self-check commands"
should_pass "format check" npm run format:check
should_pass "lint" npm run lint
should_pass "architecture check" npm run arch
should_pass "type check" npm run typecheck
should_pass "tests" env NODE_ENV=test npm test
should_pass "build" npm run build

step "Violations are caught"
ROUTES=src/orders/routes/order-routes.ts
cp $ROUTES "$WORK/order-routes.ts.bak"
printf "import { findAll } from '../repositories/order-repository.js';\nexport const all = findAll;\n" >> $ROUTES
should_fail "routes skip services to reach repositories" npm run arch
cp "$WORK/order-routes.ts.bak" $ROUTES
printf "import { listOrders } from '../orders/services/order-service.js';\nexport const x = listOrders;\n" > src/shared/uses-feature.ts
should_fail "shared depends on a feature" npm run arch
rm src/shared/uses-feature.ts
printf "async function save(): Promise<void> {\n  await Promise.resolve();\n}\nvoid 0;\nsave();\n" > src/shared/floating.ts
should_fail "unawaited promise (type-aware rule)" "${LINT_FILE[@]}" src/shared/floating.ts
rm src/shared/floating.ts

echo
echo "Node.js smoke test passed ($LINT, $TS_VERSION)"
