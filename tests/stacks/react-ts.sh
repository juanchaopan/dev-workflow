#!/usr/bin/env bash
# React 冒烟测试：按 stacks/react-ts/stack.md 建项目、装规范，跑自检命令，再确认架构检查和复杂度上限会拦下违规。
source "$(dirname "$0")/lib.sh"
F="$STACKS/react-ts/files"

step "创建项目"
cd "$WORK"
npm create vite@latest app -- --template react-ts --no-interactive
cd app
npm install

step "装规范"
npm install -D "typescript@^6" "@types/node@^$(node_major)" dependency-cruiser prettier vitest jsdom \
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
  throw new Error('模板没有 .oxlintrc.json：按 stack.md 用 ESLint 的写法补上复杂度规则后再更新这个测试');
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

step "应用外壳、分层目录和示例代码"
mkdir -p src/shared/ui src/shared/lib src/features/orders/pages src/features/orders/components src/features/orders/data-access
cat > src/App.tsx <<'EOF'
import { OrdersPage } from './features/orders/pages/OrdersPage';

export default function App() {
  return (
    <main>
      <h1>订单</h1>
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
  it('显示页面标题', () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('[]'))));
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
EOF
npm run format

step "自检命令"
should_pass "格式检查" npm run format:check
should_pass "lint" npm run lint
should_pass "架构检查" npm run arch
should_pass "类型检查" npm run typecheck
should_pass "测试" npm test
should_pass "构建" npm run build

step "违规会被拦下"
COMPONENT=src/features/orders/components/OrderList.tsx
cp $COMPONENT "$WORK/OrderList.tsx.bak"
printf "import { listOrders } from '../data-access/orders-api';\nexport const load = listOrders;\n" >> $COMPONENT
should_fail "展示组件调用 data-access" npm run arch
cp "$WORK/OrderList.tsx.bak" $COMPONENT
node -e "let b='export function f(x: number): number {\n  let r = 0;\n';for(let i=0;i<12;i++)b+='  if (x === '+i+') {\n    r += '+i+';\n  }\n';b+='  return r;\n}\n';require('fs').writeFileSync('src/shared/lib/complex.ts',b);"
should_fail "函数复杂度超标" npx oxlint src/shared/lib/complex.ts
rm src/shared/lib/complex.ts

echo
echo "React 冒烟测试通过"
