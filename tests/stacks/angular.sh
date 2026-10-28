#!/usr/bin/env bash
# Angular 冒烟测试：按 stacks/angular/stack.md 建项目、装规范，跑自检命令，再确认架构检查和复杂度上限会拦下违规。
source "$(dirname "$0")/lib.sh"
F="$STACKS/angular/files"

step "创建项目"
cd "$WORK"
npx -y @angular/cli@latest new demo --directory app --defaults --routing --style=scss --ssr=false --skip-git --ai-config=none
cd app
MAJOR=$(node -p "require('./package.json').dependencies['@angular/core'].replace(/[^0-9.]/g,'').split('.')[0]")

step "装规范（angular-eslint@$MAJOR）"
npx ng add "angular-eslint@$MAJOR" --skip-confirmation
[ -f eslint.config.js ] || npx ng add "angular-eslint@$MAJOR" --skip-confirmation
[ -f eslint.config.js ] || die "angular-eslint 没有生成 eslint.config.js"
node -e "
const fs = require('fs');
let s = fs.readFileSync('eslint.config.js', 'utf8');
s = s.replace(/\]\);\s*$/, \`  {
    files: ['**/*.ts'],
    ignores: ['**/*.spec.ts', '**/*.stories.ts'],
    rules: {
      complexity: ['error', 10],
      'max-depth': ['error', 3],
      'max-lines-per-function': ['error', { max: 60, skipBlankLines: true, skipComments: true }],
    },
  },
]);
\`);
fs.writeFileSync('eslint.config.js', s);"
npm install -D dependency-cruiser prettier "@types/node@^$(node_major)"
cp "$F/.dependency-cruiser.cjs" "$F/.prettierrc.json" "$F/.prettierignore" .
mkdir -p scripts && cp "$SHARED/arch-check.mjs" scripts/
npm pkg set scripts.arch="node scripts/arch-check.mjs" scripts.format="prettier --write ." scripts.format:check="prettier --check ."

step "按分层建目录和示例代码"
A=src/app
mkdir -p $A/core $A/shared/ui $A/shared/util $A/features/orders/pages $A/features/orders/components $A/features/orders/data-access $A/features/orders/models
cat > $A/features/orders/models/order.ts <<'EOF'
export interface Order {
  id: number;
  title: string;
}
EOF
cat > $A/features/orders/data-access/orders-api.ts <<'EOF'
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Order } from '../models/order';

@Injectable({ providedIn: 'root' })
export class OrdersApi {
  private readonly http = inject(HttpClient);

  list() {
    return this.http.get<Order[]>('/api/orders');
  }
}
EOF
cat > $A/features/orders/components/order-list.ts <<'EOF'
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Order } from '../models/order';

@Component({
  selector: 'app-order-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@for (o of orders(); track o.id) {
    <button type="button" (click)="selected.emit(o)">{{ o.title }}</button>
  }`,
})
export class OrderList {
  readonly orders = input.required<Order[]>();
  readonly selected = output<Order>();
}
EOF
cat > $A/features/orders/pages/orders-page.ts <<'EOF'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { OrderList } from '../components/order-list';
import { OrdersApi } from '../data-access/orders-api';

@Component({
  selector: 'app-orders-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OrderList],
  template: `<app-order-list [orders]="orders() ?? []" />`,
})
export class OrdersPage {
  readonly orders = toSignal(inject(OrdersApi).list());
}
EOF
npm run format

step "自检命令"
should_pass "格式检查" npm run format:check
should_pass "lint" npx ng lint
should_pass "架构检查" npm run arch
should_pass "测试" npx ng test --watch=false
should_pass "构建" npx ng build

step "违规会被拦下"
COMPONENT=$A/features/orders/components/order-list.ts
cp $COMPONENT "$WORK/order-list.ts.bak"
printf "import { OrdersApi } from '../data-access/orders-api';\nexport const api = OrdersApi;\n" >> $COMPONENT
should_fail "展示组件依赖 data-access" npm run arch
cp "$WORK/order-list.ts.bak" $COMPONENT
printf "import { HttpClient } from '@angular/common/http';\nexport const http = HttpClient;\n" >> $COMPONENT
should_fail "展示组件引用 HttpClient" npm run arch
cp "$WORK/order-list.ts.bak" $COMPONENT
node -e "let b='export function f(x: number): number {\n  let r = 0;\n';for(let i=0;i<12;i++)b+='  if (x === '+i+') {\n    r += '+i+';\n  }\n';b+='  return r;\n}\n';require('fs').writeFileSync('$A/shared/util/complex.ts',b);"
should_fail "函数复杂度超标" npx eslint $A/shared/util/complex.ts
rm $A/shared/util/complex.ts

echo
echo "Angular 冒烟测试通过"
