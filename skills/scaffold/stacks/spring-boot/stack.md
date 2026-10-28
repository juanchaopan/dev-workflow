# Spring Boot（Java）

## 识别方法

组件目录里的 `pom.xml` 继承 `spring-boot-starter-parent`，或者 `build.gradle(.kts)` 用了 `org.springframework.boot` 插件。

## 需要的工具

- JDK，版本按决策点选（`java --version`）。Maven 和 Gradle 都不用单独安装，项目自带 Wrapper（`mvnw` 或 `gradlew`）。
- curl 和 unzip（Git Bash 里都有；也可以用 `tar -xf` 解压 zip）。

## 决策点

/architect 选定这个技术栈后，逐个问用户。推荐项是本文默认的做法；选了别的，按对应工具的官方文档做等效配置，并保证自检命令、钩子规则、CI 三处一致。

| 决策 | 候选 | 推荐 |
|---|---|---|
| 构建工具 | Maven / Gradle（Kotlin DSL）/ Gradle（Groovy DSL） | Maven：配置直观、资料最多；构建逻辑复杂或多模块时用 Gradle（Kotlin DSL） |
| Java 版本 | 当前和上一个 LTS（例如 25、21） | 最新的 LTS，团队和部署环境都支持时 |
| 数据访问 | Spring Data JPA / MyBatis / jOOQ / Spring JDBC | JPA；SQL 复杂、需要精细控制时用 MyBatis 或 jOOQ |
| 数据库迁移 | Flyway / Liquibase | Flyway：纯 SQL 脚本，简单 |
| 接口风格 | REST / GraphQL / gRPC | REST |
| 认证 | OAuth2 资源服务器（令牌）/ 会话加表单登录 / 不需要 | 前后端分离用 OAuth2 资源服务器 |
| 测试数据库 | Testcontainers / H2 内存库 | Testcontainers：和生产同一种数据库 |
| Lombok | 不用 / 用 | 不用：record 和 IDE 已经能解决大部分样板代码，少一个编译期魔法 |

## 创建命令

用 Spring Initializr 生成。`type` 按构建工具选：`maven-project`、`gradle-project-kotlin`、`gradle-project`。依赖按架构文档选，可用的依赖 ID 用 `curl -s https://start.spring.io/dependencies` 查看。

```
curl -fsSL https://start.spring.io/starter.zip \
  -d type=<maven-project 或 gradle-project-kotlin> -d language=java -d javaVersion=<Java 版本> \
  -d groupId=<组织的反写域名，例如 com.example> -d artifactId=<名称> -d name=<名称> \
  -d packageName=<根包名> -d dependencies=<依赖 ID，用逗号分隔> \
  -o <名称>.zip
mkdir -p <目录> && unzip -q <名称>.zip -d <目录> && rm <名称>.zip
```

解压后确认 `pom.xml` 或 `build.gradle.kts` 在组件目录的根下；不在的话，把里面那层目录的内容移上来。

## 创建后

在组件目录下：

1. 查最新稳定版本：读 Maven Central 上的元数据文件，看 `<release>`：`curl -s https://repo1.maven.org/maven2/<groupId 里的点换成斜杠>/<artifactId>/maven-metadata.xml`。不要用 search.maven.org 的搜索接口，它的版本信息经常滞后。要查的有：
   - 两种构建工具都要：`com.puppycrawl.tools:checkstyle`、`com.tngtech.archunit:archunit-junit5`
   - Maven：`com.diffplug.spotless:spotless-maven-plugin`、`org.apache.maven.plugins:maven-checkstyle-plugin`、`org.apache.maven.plugins:maven-pmd-plugin`
   - Gradle：`com.diffplug.spotless:spotless-plugin-gradle`、`net.sourceforge.pmd:pmd-java`
2. 加入代码检查和架构测试：
   - Maven：把 `files/pom-plugins.xml` 里的插件合并进 `pom.xml` 的 `<build><plugins>`；在 `<dependencies>` 里加 `com.tngtech.archunit:archunit-junit5`，`<scope>test</scope>`。
   - Gradle：按 `files/gradle-plugins.kts` 的说明合并进 `build.gradle.kts`。
   - 填上第 1 步查到的版本号。
3. 把 `files/checkstyle.xml`、`files/pmd-ruleset.xml` 复制到组件目录。
4. 把 `files/ArchitectureTest.java` 复制到 `src/test/java/<根包名的目录>/`，`files/archunit.properties` 复制到 `src/test/resources/`，把 `{{根包名}}` 换成实际的根包名。`archunit.properties` 让还没有代码的规则直接通过，不会因为"没有可检查的类"而失败。
5. 生成的测试 `contextLoads() {}` 是空方法，PMD 会报 UncommentedEmptyMethodBody：在方法体里写一行注释说明它只验证 Spring 上下文能启动。
6. 格式化一遍生成的代码（Maven：`./mvnw spotless:apply`；Gradle：`./gradlew spotlessApply`），再跑一遍构建（Maven：`./mvnw verify`；Gradle：`./gradlew check`），必须通过。新版 Checkstyle 或 PMD 删掉、改名了配置里的某条规则时，按报错信息对照官方文档修改配置。

Windows 的 PowerShell 里用 `.\mvnw.cmd`、`.\gradlew.bat` 代替 `./mvnw`、`./gradlew`。

下载依赖失败、报错里出现连不上某个私有仓库地址时，检查 `~/.m2/settings.xml` 的 `<mirror>` 或 `~/.gradle/init.gradle(.kts)`：它们会把下载转到别的地址。不要改用户的全局设置，告诉用户原因，由用户决定。

## 自检命令

| 构建工具 | 格式化 | lint 和架构测试 | 类型检查 | 测试 | 构建 |
|---|---|---|---|---|---|
| Maven | `./mvnw spotless:apply` | `./mvnw -q verify` | 包含在编译里 | `./mvnw test` | `./mvnw verify` |
| Gradle | `./gradlew spotlessApply` | `./gradlew check` | 包含在编译里 | `./gradlew test` | `./gradlew build` |

Maven 的 `verify` 和 Gradle 的 `check` 都会运行格式检查、Checkstyle、PMD 和全部测试（包括 `ArchitectureTest`）。

## 格式化钩子规则

不配置。每次启动 Maven 或 Gradle 要好几秒，每改一个文件就跑一次太慢。格式化放在自检命令里，提交前运行。

## CI 步骤

```yaml
  <组件>:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: <目录>
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '<Java 版本>'
          cache: <maven 或 gradle>
      - run: <Maven：./mvnw -B verify；Gradle：./gradlew build>
```

## 版本号

- Maven：`./mvnw versions:set -DnewVersion=<版本号> -DgenerateBackupPoms=false`
- Gradle：修改 `build.gradle.kts` 里的 `version = "<版本号>"`

## 参考资料

- Google Java Style Guide：https://google.github.io/styleguide/javaguide.html
- 阿里巴巴《Java 开发手册》：https://github.com/alibaba/p3c
- Spring Boot 官方文档：https://docs.spring.io/spring-boot/
- ArchUnit：https://www.archunit.org/userguide/html/000_Index.html
- Spotless：https://github.com/diffplug/spotless
- Checkstyle：https://checkstyle.org/
- PMD：https://pmd.github.io/
