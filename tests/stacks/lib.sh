#!/usr/bin/env bash
# Shared functions for the stack smoke tests. Each stack's script creates a real project following its stack.md, installs the
# standards, runs the self-check commands, then writes a few violations on purpose and confirms the checks fail.
# When generators, tool versions or default configurations change, this breaks first.
# Versions are looked up exactly as stack.md does, never hard-coded: each weekly run tests the versions a project created that week gets.
# The working directory comes from the WORK environment variable, or a new temporary directory.
set -euo pipefail

HERE=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
SKILLS=$(cd "$HERE/../../skills" && pwd)
export STACKS="$SKILLS/scaffold/stacks"
export SHARED="$SKILLS/scaffold/shared"
WORK=${WORK:-$(mktemp -d)}
mkdir -p "$WORK"
LOG="$WORK/last.log"
export NG_CLI_ANALYTICS=false DOTNET_CLI_TELEMETRY_OPTOUT=1 DOTNET_NOLOGO=1

step() { echo; echo "== $*"; }
ok() { echo "✓ $*"; }
die() { echo "✗ $*" >&2; exit 1; }

# should_pass <description> <command...>: the command must succeed.
should_pass() {
  local desc=$1
  shift
  if "$@" >"$LOG" 2>&1; then ok "$desc"; else cat "$LOG"; die "$desc"; fi
}

# should_fail <description> <command...>: the command must fail; confirms a violation is caught.
should_fail() {
  local desc=$1
  shift
  if "$@" >"$LOG" 2>&1; then cat "$LOG"; die "$desc: should have failed but passed"; else ok "$desc"; fi
}

# latest_maven <groupId> <artifactId>: the latest stable version on Maven Central.
latest_maven() {
  curl -fsSL "https://repo1.maven.org/maven2/${1//.//}/$2/maven-metadata.xml" | sed -n 's:.*<release>\(.*\)</release>.*:\1:p'
}

# npm_compatible <package> <tool...>: the highest stable version every tool supports; see scaffold/shared/versions.mjs.
npm_compatible() { node "$SHARED/versions.mjs" npm "$@"; }

# lts <product>: the current LTS on endoflife.date (the latest stable release for products without an LTS concept), e.g. lts python.
lts() { node "$SHARED/versions.mjs" lts "$1"; }

node_major() { node -p 'process.versions.node.split(".")[0]'; }

java_major() { java -XshowSettings:properties -version 2>&1 | sed -n 's/^ *java\.specification\.version = //p'; }
