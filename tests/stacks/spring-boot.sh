#!/usr/bin/env bash
# Spring Boot 冒烟测试：按 stacks/spring-boot/stack.md 建项目、装规范（BUILD_TOOL=maven 或 gradle），
# 跑完整构建，再确认 ArchUnit、Checkstyle 会拦下违规。
# 文件路径一律通过命令行参数交给 node：Windows 的 Git Bash 只会转换参数里的路径，不会转换写在代码字符串里的路径。
source "$(dirname "$0")/lib.sh"
F="$STACKS/spring-boot/files"
BUILD_TOOL=${BUILD_TOOL:-maven}

case "$BUILD_TOOL" in
  maven) TYPE=maven-project ;;
  gradle) TYPE=gradle-project-kotlin ;;
  *) die "BUILD_TOOL 只能是 maven 或 gradle" ;;
esac

step "创建项目（$BUILD_TOOL）"
cd "$WORK"
curl -fsSL https://start.spring.io/starter.zip -d type=$TYPE -d language=java -d javaVersion=21 \
  -d groupId=com.example -d artifactId=demo -d name=demo -d packageName=com.example.demo \
  -d dependencies=web,validation,data-jpa,h2 -o demo.zip
mkdir -p app && unzip -q demo.zip -d app && rm demo.zip
cd app
chmod +x mvnw gradlew 2>/dev/null || true

step "查最新版本"
ARCHUNIT=$(latest_maven com.tngtech.archunit archunit-junit5)
CHECKSTYLE=$(latest_maven com.puppycrawl.tools checkstyle)
echo "archunit $ARCHUNIT, checkstyle $CHECKSTYLE"

step "装规范"
if [ "$BUILD_TOOL" = maven ]; then
  SPOTLESS=$(latest_maven com.diffplug.spotless spotless-maven-plugin)
  CHECKSTYLE_PLUGIN=$(latest_maven org.apache.maven.plugins maven-checkstyle-plugin)
  PMD_PLUGIN=$(latest_maven org.apache.maven.plugins maven-pmd-plugin)
  node - "$F/pom-plugins.xml" "$SPOTLESS" "$CHECKSTYLE_PLUGIN" "$CHECKSTYLE" "$PMD_PLUGIN" "$ARCHUNIT" <<'EOF'
const fs = require('fs');
const [snippetPath, spotless, checkstylePlugin, checkstyle, pmdPlugin, archunit] = process.argv.slice(2);
const versions = { 'spotless-maven-plugin': spotless, 'maven-checkstyle-plugin': checkstylePlugin, checkstyle, 'maven-pmd-plugin': pmdPlugin };
let plugins = fs.readFileSync(snippetPath, 'utf8').replace(/<!--[\s\S]*?-->/, '');
plugins = plugins.replace(
  /<artifactId>([^<]+)<\/artifactId>(\s*)<version>\{\{版本\}\}<\/version>/g,
  (m, artifact, space) => `<artifactId>${artifact}</artifactId>${space}<version>${versions[artifact]}</version>`,
);
const dependency = `  <dependency>
      <groupId>com.tngtech.archunit</groupId>
      <artifactId>archunit-junit5</artifactId>
      <version>${archunit}</version>
      <scope>test</scope>
    </dependency>
  </dependencies>`;
const pom = fs.readFileSync('pom.xml', 'utf8').replace('<plugins>', `<plugins>\n${plugins}`).replace('</dependencies>', dependency);
fs.writeFileSync('pom.xml', pom);
EOF
  FORMAT=(./mvnw -q -B spotless:apply)
  BUILD=(./mvnw -B verify)
  TEST=(./mvnw -B test)
else
  SPOTLESS=$(latest_maven com.diffplug.spotless spotless-plugin-gradle)
  PMD=$(latest_maven net.sourceforge.pmd pmd-java)
  node - "$F/gradle-plugins.kts" "$SPOTLESS" "$ARCHUNIT" "$CHECKSTYLE" "$PMD" <<'EOF'
const fs = require('fs');
const [snippetPath, ...versions] = process.argv.slice(2);
let snippet = fs.readFileSync(snippetPath, 'utf8').replace(/^\/\/.*\n/gm, '');
let i = 0;
snippet = snippet.replace(/\{\{版本\}\}/g, () => versions[i++]);
const take = (name) => {
  const match = snippet.match(new RegExp(`${name} \\{\\n([\\s\\S]*?)\\n\\}\\n`));
  snippet = snippet.replace(match[0], '');
  return match[1];
};
const plugins = take('plugins');
const dependencies = take('dependencies');
let gradle = fs.readFileSync('build.gradle.kts', 'utf8');
gradle = gradle.replace(/plugins \{\n/, `plugins {\n${plugins}\n`).replace(/dependencies \{\n/, `dependencies {\n${dependencies}\n`);
fs.writeFileSync('build.gradle.kts', `${gradle}\n${snippet.trim()}\n`);
EOF
  FORMAT=(./gradlew -q spotlessApply)
  BUILD=(./gradlew build --console=plain)
  TEST=(./gradlew test --console=plain)
fi
cp "$F/checkstyle.xml" "$F/pmd-ruleset.xml" .
mkdir -p src/test/resources
cp "$F/archunit.properties" src/test/resources/
sed 's/{{根包名}}/com.example.demo/g' "$F/ArchitectureTest.java" > src/test/java/com/example/demo/ArchitectureTest.java
node - src/test/java/com/example/demo/DemoApplicationTests.java <<'EOF'
const fs = require('fs');
const file = process.argv[2];
const source = fs.readFileSync(file, 'utf8');
fs.writeFileSync(file, source.replace(/void contextLoads\(\) \{\s*\}/, 'void contextLoads() {\n    // 只验证 Spring 上下文能正常启动。\n  }'));
EOF

step "按分层写示例代码"
M=src/main/java/com/example/demo/order
mkdir -p $M/controller $M/service $M/repository $M/domain
cat > $M/domain/Order.java <<'EOF'
package com.example.demo.order.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity
public class Order {
  @Id private Long id;

  public Long getId() {
    return id;
  }
}
EOF
cat > $M/repository/OrderRepository.java <<'EOF'
package com.example.demo.order.repository;

import com.example.demo.order.domain.Order;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, Long> {}
EOF
cat > $M/service/OrderService.java <<'EOF'
package com.example.demo.order.service;

import com.example.demo.order.repository.OrderRepository;
import org.springframework.stereotype.Service;

@Service
public class OrderService {
  private final OrderRepository orders;

  public OrderService(OrderRepository orders) {
    this.orders = orders;
  }

  public long count() {
    return orders.count();
  }
}
EOF
cat > $M/controller/OrderController.java <<'EOF'
package com.example.demo.order.controller;

import com.example.demo.order.service.OrderService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class OrderController {
  private final OrderService orders;

  public OrderController(OrderService orders) {
    this.orders = orders;
  }

  @GetMapping("/api/v1/orders/count")
  public long count() {
    return orders.count();
  }
}
EOF

step "格式化和完整构建（格式、Checkstyle、PMD、测试、架构测试）"
"${FORMAT[@]}"
should_pass "完整构建" "${BUILD[@]}"

step "违规会被拦下"
CONTROLLER=$M/controller/OrderController.java
cp $CONTROLLER "$WORK/OrderController.java.bak"
cat > $CONTROLLER <<'EOF'
package com.example.demo.order.controller;

import com.example.demo.order.repository.OrderRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class OrderController {
  private final OrderRepository orders;

  public OrderController(OrderRepository orders) {
    this.orders = orders;
  }

  @GetMapping("/api/v1/orders/count")
  public long count() {
    return orders.count();
  }
}
EOF
should_fail "controller 跳过 service 直接访问 repository" "${TEST[@]}"
cp "$WORK/OrderController.java.bak" $CONTROLLER
cat > $M/service/Bad.java <<'EOF'
package com.example.demo.order.service;

import java.util.*;

public class Bad {
  public boolean same(String a) {
    if (a == "x") return true;
    return false;
  }
}
EOF
should_fail "Checkstyle 和 PMD 拦下坏写法" "${BUILD[@]}"
rm $M/service/Bad.java

echo
echo "Spring Boot（$BUILD_TOOL）冒烟测试通过"
