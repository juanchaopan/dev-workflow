---
paths:
  - "{{组件目录}}/**"
---

# Spring Boot 规范：{{组件名}}

来源：Google Java Style Guide、阿里巴巴《Java 开发手册》、Spring Boot 官方文档。格式由 Spotless（google-java-format）负责，常见的代码问题由 Checkstyle 和 PMD 检查，分层规则由 `ArchitectureTest`（ArchUnit）检查；这里写需要判断的部分。

## 分层

按功能分包，包内分层：

```
{{根包名}}/
├── <功能>/
│   ├── controller/    接收请求、校验参数、调用 service、返回 DTO
│   ├── service/       业务逻辑和事务边界
│   ├── repository/    数据访问
│   ├── domain/        实体和领域规则
│   └── dto/           接口的入参和返回值
└── shared/            几个功能共用的配置、异常处理、工具
```

依赖方向只能是 controller → service → repository，由 `ArchitectureTest` 强制：

- controller 只被外部调用，不被任何层依赖；service 只被 controller 依赖；repository 只被 service 依赖。controller 不能跳过 service 直接访问 repository。
- controller 不接触实体（`@Entity`），入参和返回值都是 DTO。实体和 DTO 的转换集中在一处。
- 功能包之间不能循环依赖。一个功能需要另一个功能的数据时，调用对方的 service，不直接访问对方的 repository。
- 只用构造器注入；不用 `System.out`、`System.err`。

## 依赖注入和配置

- 依赖声明为 final，通过构造器注入。
- 配置用 `@ConfigurationProperties` 绑定成类型安全的对象，不到处写 `@Value`。
- 密钥和密码不写进 `application.yml`，通过环境变量注入；不同环境用 profile 区分。

## 接口

- 入参用 jakarta.validation 注解校验（`@Valid`、`@NotBlank` 等）。
- 统一用 `@RestControllerAdvice` 处理异常，错误响应用 `ProblemDetail`（RFC 9457）格式；不把异常堆栈返回给调用方。
- 接口带版本（路径 `/api/v1/...`），破坏兼容的修改出新版本。
- 列表接口必须分页。

## 数据和事务

- `@Transactional` 放在 service 的公开方法上，不放在 controller 和 repository 上；只读方法用 `readOnly = true`。
- 注意 JPA 的 N+1 查询：关联默认懒加载，需要时用 fetch join 或 `@EntityGraph`。
- 数据库结构变更用迁移脚本（Flyway 或 Liquibase，以架构文档的选择为准），脚本合并后不再修改。
- 金额用 `BigDecimal`，不用 float、double（阿里手册）。
- 时间用 java.time；存储和传输用 UTC 的 `Instant` 或 `OffsetDateTime`。

## 并发和资源

- 线程池用 `ThreadPoolExecutor` 显式创建，指定队列长度和拒绝策略，不用 `Executors` 的工厂方法，避免无界队列撑爆内存（阿里手册）。
- 调用外部服务必须设置连接超时和读取超时。
- 单例 bean 里不放和请求相关的可变状态。

## 代码习惯

- 不用魔法值：有业务含义的数字和字符串定义成常量或枚举（阿里手册）。
- 返回集合时返回空集合，不返回 null。可能没有值时用 `Optional` 作返回值，不把它用作字段和参数。
- 日志用 SLF4J 的占位符写法 `log.info("order {} paid", id)`，不拼接字符串；不打印密码、令牌和完整的个人信息。
- 捕获的异常要么处理掉，要么包装后抛出并带上原因，不吞掉。

## 测试

- 单元测试测 service 的业务逻辑；接口用 `@WebMvcTest`，数据访问用 `@DataJpaTest`。这些切片测试比整个 `@SpringBootTest` 快得多。
- 依赖数据库的测试用 Testcontainers 起真实的数据库，不用和生产不同的内存数据库。
- 测试方法名写清场景和期望，例如 `shouldRejectOrderWhenStockIsInsufficient`。
