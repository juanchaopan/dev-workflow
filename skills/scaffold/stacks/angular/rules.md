---
paths:
  - "{{组件目录}}/**"
---

# Angular 规范：{{组件名}}

来源：Angular 官方风格指南（https://angular.dev/style-guide）。格式和能自动检查的规则交给 Prettier 和 angular-eslint；这里写工具查不出来、需要判断的部分。

## 结构

- 按功能分目录（`features/orders/`），不按类型分（`components/`、`services/`）。几个功能共用的放 `shared/`，全局单例服务和拦截器放 `core/`。
- 组件、服务、守卫用 `ng generate` 创建，文件命名跟 CLI 生成的保持一致。
- 一个文件只放一个组件或服务。

## 组件

- 只用独立组件（standalone），不新建 NgModule。
- 设置 `changeDetection: ChangeDetectionStrategy.OnPush`。
- 组件只负责展示和交互；业务逻辑、HTTP 调用和共享状态放在服务里。
- 输入输出用 `input()`、`output()`、`model()`，不用 `@Input`、`@Output` 装饰器。
- 依赖注入用 `inject()`。
- 模板用内置控制流 `@if`、`@for`（必须写 `track`）、`@switch`，不用 `*ngIf`、`*ngFor`。
- 模板里不写复杂表达式和函数调用，派生值用 `computed()`。

## 状态和数据

- 组件状态用 signal；跨组件共享的状态放在服务里的 signal。
- RxJS 用于异步事件流（HTTP、WebSocket、防抖输入）。订阅用 `async` 管道、`toSignal()` 或 `takeUntilDestroyed()` 管理，不留下没取消的订阅。
- HTTP 只在服务里调用；接口数据用 TypeScript 接口描述，不用 `any`。
- 表单用类型化的响应式表单，校验规则写在表单定义里。

## 路由和权限

- 功能页面懒加载（`loadComponent`、`loadChildren`）。
- 路由守卫用函数式守卫。前端的权限检查只是体验，真正的授权在后端做。

## 质量

- 可交互元素都能用键盘操作，图片有 alt，表单控件有 label。
- 用户看得到的文字集中管理，方便以后做多语言。
- 加载中、出错、空数据三种状态都要有界面。
- 测试：服务测业务逻辑；组件测用户看得到、操作得了的行为，不测内部实现。
- 生产代码里不留 `console.log`。
