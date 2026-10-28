// 合并进 build.gradle.kts：plugins 和 dependencies 里的条目加进已有的同名块，其余的块追加到文件末尾。
// {{版本}} 换成最新稳定版本，查法见 stack.md。
// ./gradlew check 会依次运行 Spotless 格式检查、Checkstyle、PMD 和全部测试（包括 ArchitectureTest），任何一项不通过，构建就失败。

plugins {
    checkstyle
    pmd
    id("com.diffplug.spotless") version "{{版本}}"
}

dependencies {
    testImplementation("com.tngtech.archunit:archunit-junit5:{{版本}}")
}

spotless {
    java {
        googleJavaFormat()
        removeUnusedImports()
    }
}

checkstyle {
    toolVersion = "{{版本}}"
    configFile = file("checkstyle.xml")
    maxWarnings = 0
}

pmd {
    toolVersion = "{{版本}}"
    ruleSetFiles = files("pmd-ruleset.xml")
    ruleSets = listOf()
    isConsoleOutput = true
}
