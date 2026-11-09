#!/usr/bin/env bash
# React smoke test: creates a project following stacks/react-ts/stack.md, installs the standards, runs the self-check commands,
# then confirms the architecture check and complexity limits catch violations.
# TypeScript is the latest release the template installs; the architecture check parses with SWC and is not limited by it.
source "$(dirname "$0")/lib.sh"
F="$STACKS/react-ts/files"

step "Create the project"
cd "$WORK"
npm create vite@latest app -- --template react-ts --no-interactive
cd app
npm install
TS_VERSION=$(npx tsc --version)
echo "$TS_VERSION"

step "Install the standards"
npm install -D "@types/node@^$(node_major)" dependency-cruiser @swc/core prettier vitest jsdom \
  @testing-library/react @testing-library/dom @testing-library/jest-dom @testing-library/user-event
node -e "
const fs = require('fs');
if (fs.existsSync('.oxlintrc.json')) {
  const c = JSON.parse(fs.readFileSync('.oxlintrc.json', 'utf8'));
  Object.assign(c.rules ??= {}, {
    'eslint/complexity': ['error', 10],
    'eslint/max-depth': ['error', 3],
    'eslint/max-lines-per-function': ['error', { max: 100, skipBlankLines: true, skipComments: true }],
  });
  c.ignorePatterns = ['**/*.test.ts', '**/*.test.tsx', '**/*.stories.tsx', '.dependency-cruiser.cjs'];
  fs.writeFileSync('.oxlintrc.json', JSON.stringify(c, null, 2));
} else {
  throw new Error('The template has no .oxlintrc.json: add the complexity rules the ESLint way described in stack.md, then update this test');
}"
cp "$F/.dependency-cruiser.cjs" "$F/.prettierrc.json" "$F/.prettierignore" .
mkdir -p scripts src/test && cp "$SHARED/arch-check.mjs" scripts/ && cp "$F/src/test/setup.ts" src/test/
cat > vite.config.ts <<'EOF'
/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    projects: [
      {
        extends: true,
        test: { name: 'unit', environment: 'jsdom', setupFiles: './src/test/setup.ts', include: ['src/**/*.test.{ts,tsx}'] },
      },
    ],
  },
});
EOF
npm pkg set scripts.arch="node scripts/arch-check.mjs" scripts.test="vitest run" scripts.typecheck="tsc -b" \
  scripts.format="prettier --write ." scripts.format:check="prettier --check ."

step "Application shell, layered directories and sample code"
mkdir -p src/shared/ui src/shared/lib src/features/orders/pages src/features/orders/components src/features/orders/data-access
cat > src/App.tsx <<'EOF'
import { OrdersPage } from './features/orders/pages/OrdersPage';

export default function App() {
  return (
    <main>
      <h1>Orders</h1>
      <OrdersPage />
    </main>
  );
}
EOF
cat > src/features/orders/data-access/orders-api.ts <<'EOF'
export interface Order {
  id: number;
  title: string;
}

export async function listOrders(): Promise<Order[]> {
  const response = await fetch('/api/orders');
  return (await response.json()) as Order[];
}
EOF
cat > src/features/orders/components/OrderList.tsx <<'EOF'
import type { Order } from '../data-access/orders-api';

export function OrderList({ orders }: { orders: Order[] }) {
  return (
    <ul>
      {orders.map((o) => (
        <li key={o.id}>{o.title}</li>
      ))}
    </ul>
  );
}
EOF
cat > src/features/orders/pages/OrdersPage.tsx <<'EOF'
import { useEffect, useState } from 'react';
import { OrderList } from '../components/OrderList';
import { listOrders, type Order } from '../data-access/orders-api';

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  useEffect(() => {
    listOrders()
      .then(setOrders)
      .catch(() => setOrders([]));
  }, []);
  return <OrderList orders={orders} />;
}
EOF
cat > src/App.test.tsx <<'EOF'
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from './App';

describe('App', () => {
  it('shows the page title', () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('[]'))));
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
EOF
npm run format

step "Self-check commands"
should_pass "format check" npm run format:check
should_pass "lint" npm run lint
should_pass "architecture check (a presentational component may import data-access types)" npm run arch
should_pass "type check" npm run typecheck
should_pass "tests" npm test
should_pass "build" npm run build

step "Violations are caught"
COMPONENT=src/features/orders/components/OrderList.tsx
cp $COMPONENT "$WORK/OrderList.tsx.bak"
printf "import { listOrders } from '../data-access/orders-api';\nexport const load = listOrders;\n" >> $COMPONENT
should_fail "presentational component calls data-access at runtime" npm run arch
cp "$WORK/OrderList.tsx.bak" $COMPONENT
node -e "let b='export function f(x: number): number {\n  let r = 0;\n';for(let i=0;i<12;i++)b+='  if (x === '+i+') {\n    r += '+i+';\n  }\n';b+='  return r;\n}\n';require('fs').writeFileSync('src/shared/lib/complex.ts',b);"
should_fail "function too complex" npx oxlint src/shared/lib/complex.ts
rm src/shared/lib/complex.ts

echo
echo "React smoke test passed ($TS_VERSION)"
