# Spring Boot（Java）

## 识别方法

组件目录里的 `pom.xml` 继承 `spring-boot-starter-parent`，或者 `build.gradle(.kts)` 用了 `org.springframework.boot` 插件。下面的配置按 Maven 写；用 Gradle 时换成对应的 Gradle 插件。

## 需要的工具

- JDK 21 或更新的 LTS 版本（`java --version`）。Maven 不用单独安装，项目自带 Maven Wrapper（`mvnw`）。
- curl 和 unzip（Git Bash 里都有；也可以用 `tar -xf` 解压 zip）。

## 创建命令

用 Spring Initializr 生成。依赖按架构文档选，可用的依赖 ID 用 `curl -s https://start.spring.io/dependencies` 查看，常用的有 `web`、`validation`、`actuator`、`data-jpa`、`postgresql`、`flyway`、`security`、`oauth2-resource-server`、`testcontainers`。

```
curl -fsSL https://start.spring.io/starter.zip \
  -d type=maven-project -d language=java -d javaVersion=21 \
  -d groupId=<组织的反写域名，例如 com.example> -d artifactId=<名称> -d name=<名称> \
  -d packageName=<包名> -d dependencies=<依赖 ID，用逗号分隔> \
  -o <名称>.zip
mkdir -p <目录> && unzip -q <名称>.zip -d <目录> && rm <名称>.zip
```

解压后确认 `pom.xml` 在组件目录的根下；不在的话，把里面那层目录的内容移上来。

## 创建后

在组件目录下：

1. 查下面几个插件的最新稳定版本：`com.diffplug.spotless:spotless-maven-plugin`、`org.apache.maven.plugins:maven-checkstyle-plugin`、`com.puppycrawl.tools:checkstyle`、`org.apache.maven.plugins:maven-pmd-plugin`。查询方法是读 Maven Central 上的元数据文件，看 `<release>`：`curl -s https://repo1.maven.org/maven2/<groupId 里的点换成斜杠>/<artifactId>/maven-metadata.xml`。不要用 search.maven.org 的搜索接口，它的版本信息经常滞后。
2. 把 `files/pom-plugins.xml` 里的插件合并进 `pom.xml` 的 `<build><plugins>`，填上版本号。
3. 把 `files/checkstyle.xml`、`files/pmd-ruleset.xml` 复制到组件目录。
4. 生成的测试 `contextLoads() {}` 是空方法，PMD 会报 UncommentedEmptyMethodBody：在方法体里写一行注释说明它只验证 Spring 上下文能启动。
5. `./mvnw spotless:apply`，把生成的代码统一格式化一遍。
6. `./mvnw verify`，必须通过。新版 Checkstyle 或 PMD 删掉、改名了配置里的某条规则时，按报错信息对照官方文档修改配置。

Windows 的 PowerShell 里用 `.\mvnw.cmd` 代替 `./mvnw`。

Maven 下载依赖失败、报错里出现连不上某个私有仓库地址时，检查 `~/.m2/settings.xml` 里的 `<mirror>`：它会把所有下载都转到那个地址。不要改用户的全局设置，告诉用户原因，由用户决定是修好私有仓库的连接，还是给这个项目改用 Maven Central。

## 自检命令

| 格式化 | lint | 类型检查 | 测试 | 构建 |
|---|---|---|---|---|
| `./mvnw spotless:apply` | `./mvnw -q -DskipTests verify` | 包含在编译里 | `./mvnw test` | `./mvnw verify` |

`verify` 会依次运行编译、测试、打包，以及绑定在 verify 阶段的 Spotless 格式检查、Checkstyle 和 PMD。

## 格式化钩子规则

不配置。每次启动 Maven 要好几秒，每改一个文件就跑一次太慢。格式化放在自检命令里，提交前运行。

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
          java-version: '21'
          cache: maven
      - run: ./mvnw -B verify
```

## 版本号

`pom.xml` 的 `<version>`：`./mvnw versions:set -DnewVersion=<版本号> -DgenerateBackupPoms=false`

## 参考资料

- Google Java Style Guide：https://google.github.io/styleguide/javaguide.html
- 阿里巴巴《Java 开发手册》：https://github.com/alibaba/p3c
- Spring Boot 官方文档：https://docs.spring.io/spring-boot/
- Spotless：https://github.com/diffplug/spotless
- Checkstyle：https://checkstyle.org/
- PMD：https://pmd.github.io/
