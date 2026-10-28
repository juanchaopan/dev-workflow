---
paths:
  - "{{组件目录}}/**"
---

# Angular 规范：{{组件名}}

来源：Angular 官方风格指南（https://angular.dev/style-guide），以及社区通行的容器组件和展示组件（Container / Presentational，也叫 Smart / Dumb）分层。格式和能自动检查的规则交给 Prettier 和 angular-eslint；分层规则由 dependency-cruiser（`.dependency-cruiser.cjs`，`npm run arch`）检查；这里写需要判断的部分。

## 分层：页面和展示组件

```
src/app/
├── core/                  全局单例服务、HTTP 拦截器、守卫
├── shared/ui/             几个功能共用的展示组件
├── shared/util/           纯函数、管道
└── features/<功能>/
    ├── pages/             页面：路由指向它
    ├── components/        展示组件
    ├── data-access/       API 客户端、store、状态服务
    └── models/            类型定义
```

**页面（容器组件）**负责"数据从哪来、到哪去"：

- 注入 data-access 的服务或 store，调 API，处理加载中、出错和空数据。
- 持有状态（signal 或 store），通过属性绑定把数据交给子组件，通过子组件的事件更新状态；需要父子同步一个值时用 `model()` 双向绑定。
- 处理导航和路由参数。
- 本身尽量不写样式和复杂的模板，布局交给展示组件。

**展示组件**只负责"长什么样"：

- 无状态：数据只从 `input()` 进，变化只通过 `output()` 或 `model()` 出。内部只允许纯界面状态，例如展开、收起、悬停。
- 不注入服务，不调 API，不访问 store 和路由状态。需要什么数据，由页面传进来。
- 设置 `changeDetection: ChangeDetectionStrategy.OnPush`。
- 给定输入就能独立渲染，这样才能在 Storybook 里展示、单独测试。

由 `npm run arch` 强制的依赖规则：

- 展示组件（`components/`、`shared/ui/`）不能依赖 data-access、pages、core，也不能引用 `HttpClient` 和 NgRx；可以引用 models 里的类型。
- data-access 不依赖界面。
- 功能之间不互相引用，几个功能共用的东西提到 `shared/`。
- shared 和 core 不依赖任何功能。
- 不允许循环依赖。

## 组件写法

- 只用独立组件（standalone），不新建 NgModule。
- 组件、服务、守卫用 `ng generate` 创建，文件命名跟 CLI 生成的保持一致。一个文件只放一个组件或服务。
- 输入输出用 `input()`、`output()`、`model()`，不用 `@Input`、`@Output` 装饰器。
- 依赖注入用 `inject()`。
- 模板用内置控制流 `@if`、`@for`（必须写 `track`）、`@switch`，不用 `*ngIf`、`*ngFor`。
- 模板里不写复杂表达式和函数调用，派生值用 `computed()`。

## 状态和数据

- 组件状态用 signal；跨组件共享的状态放在 data-access 的服务或 store 里。
- RxJS 用于异步事件流（HTTP、WebSocket、防抖输入）。订阅用 `async` 管道、`toSignal()` 或 `takeUntilDestroyed()` 管理，不留下没取消的订阅。
- HTTP 只在 data-access 里调用；接口数据用 models 里的类型描述，不用 `any`。
- 表单用类型化的响应式表单，校验规则写在表单定义里。

## 路由和权限

- 页面懒加载（`loadComponent`、`loadChildren`）。
- 路由守卫用函数式守卫。前端的权限检查只是体验，真正的授权在后端做。

## 样式

- 颜色、字号、间距、圆角用设计令牌（`var(--...)`），不写死颜色值和像素值。
- 展示组件的样式只作用于自己，不改写子组件和全局样式。

## 质量

- 可交互元素都能用键盘操作，图片有 alt，表单控件有 label。
- 用户看得到的文字集中管理，方便以后做多语言。
- 测试：data-access 测数据逻辑；展示组件测"给定输入显示什么、点了发出什么事件"；页面测和 data-access 的配合。
- 生产代码里不留 `console.log`。
