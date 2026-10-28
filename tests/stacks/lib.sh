#!/usr/bin/env bash
# 各技术栈冒烟测试的公共函数。每个技术栈的脚本按它 stack.md 的步骤真建一个项目、装上规范、跑一遍自检命令，
# 再故意写几处违反规范的代码，确认检查会失败。生成器、工具版本和默认配置变了，这里会最先坏掉。
# 工作目录用环境变量 WORK 指定，不指定时用一个新的临时目录。
set -euo pipefail

HERE=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
SKILLS=$(cd "$HERE/../../skills" && pwd)
STACKS="$SKILLS/scaffold/stacks"
SHARED="$SKILLS/scaffold/shared"
WORK=${WORK:-$(mktemp -d)}
mkdir -p "$WORK"
LOG="$WORK/last.log"
export NG_CLI_ANALYTICS=false DOTNET_CLI_TELEMETRY_OPTOUT=1 DOTNET_NOLOGO=1

step() { echo; echo "== $*"; }
ok() { echo "✓ $*"; }
die() { echo "✗ $*" >&2; exit 1; }

# should_pass <说明> <命令…>：命令必须成功。
should_pass() {
  local desc=$1
  shift
  if "$@" >"$LOG" 2>&1; then ok "$desc"; else cat "$LOG"; die "$desc"; fi
}

# should_fail <说明> <命令…>：命令必须失败，用来确认违规会被拦下。
should_fail() {
  local desc=$1
  shift
  if "$@" >"$LOG" 2>&1; then cat "$LOG"; die "$desc：应该失败，却通过了"; else ok "$desc"; fi
}

# latest_maven <groupId> <artifactId>：Maven Central 上的最新稳定版本。
latest_maven() {
  curl -fsSL "https://repo1.maven.org/maven2/${1//.//}/$2/maven-metadata.xml" | sed -n 's:.*<release>\(.*\)</release>.*:\1:p'
}

node_major() { node -p 'process.versions.node.split(".")[0]'; }
