---
paths:
  - "{{组件目录}}/**"
---

# React 规范：{{组件名}}

来源：React 官方文档（https://react.dev/learn）。格式由 Prettier 负责，Hooks 规则等由模板自带的 linter（oxlint 或 ESLint）检查，类型由 TypeScript 检查；这里写需要判断的部分。

## 结构

- 按功能分目录（`features/orders/`），每个功能目录里放自己的组件、hooks、API 调用和测试。几个功能共用的放 `shared/`。
- 组件文件名用 PascalCase（`OrderList.tsx`），hook 文件用 `useXxx.ts`。

## 组件

- 只写函数组件。props 用 TypeScript 类型描述，不用 `any`。
- 组件只负责展示和交互；数据获取和业务规则放在自定义 hook 或服务模块里。
- 一个组件太长（大约超过 200 行）或者做了几件事时，拆开。
- 列表的 key 用稳定的业务 ID，不用数组下标。

## 状态

- 状态放在用到它的最近的组件里；几个组件共享时再往上提，或者放进 context 或状态库。
- 从服务器来的数据用专门的库管理（例如 TanStack Query），不用 useEffect 加 useState 自己拼。
- 能从现有状态算出来的值直接计算，不另存一份。
- useEffect 只用来和外部系统同步（订阅、DOM、定时器），并写好清理函数；不用它响应用户操作或派生状态。

## 数据和安全

- API 调用集中在一个模块里，统一处理错误和认证。
- 不用 `dangerouslySetInnerHTML` 渲染用户输入的内容。
- `import.meta.env` 里的变量会被打包进前端，只放公开的配置，不放密钥。

## 质量

- 可交互元素用语义化的标签（button、a、label），能用键盘操作。
- 加载中、出错、空数据三种状态都要有界面。
- 测试用 Testing Library，按用户看得到的内容查找元素（role、label、文字），不测内部状态。
- 生产代码里不留 `console.log`。
