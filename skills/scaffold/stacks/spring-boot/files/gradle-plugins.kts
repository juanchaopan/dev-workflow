// Merge into build.gradle.kts: entries of plugins and dependencies go into the existing blocks of the same name; the other blocks are appended at the end.
// Replace {{version}} with the latest stable versions; stack.md says how to look them up.
// ./gradlew check runs the Spotless format check, Checkstyle, PMD and every test (ArchitectureTest included); any failure fails the build.

plugins {
    checkstyle
    pmd
    id("com.diffplug.spotless") version "{{version}}"
}

dependencies {
    testImplementation("com.tngtech.archunit:archunit-junit5:{{version}}")
}

spotless {
    java {
        googleJavaFormat()
        removeUnusedImports()
    }
}

checkstyle {
    toolVersion = "{{version}}"
    configFile = file("checkstyle.xml")
    maxWarnings = 0
}

pmd {
    toolVersion = "{{version}}"
    ruleSetFiles = files("pmd-ruleset.xml")
    ruleSets = listOf()
    isConsoleOutput = true
}
