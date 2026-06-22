#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." &> /dev/null && pwd)"
WORK_DIR="$REPO_ROOT/local-run/readme-smoke"
LOG_DIR="$WORK_DIR/logs"

WITH_VIEWER=false
KEEP_RUNNING=false
SKIP_INSTALL=false
WAIT_TIMEOUT_SEC=120

SERVICE_NAMES=()
SERVICE_PIDS=()
RUN_STARTED=false

timestamp() {
  date +"%Y-%m-%d %H:%M:%S"
}

log() {
  printf '[%s] %s\n' "$(timestamp)" "$*"
}

die() {
  log "ERROR: $*"
  exit 1
}

usage() {
  cat <<'EOF'
Smoke-test README setup steps for the SecuWeb Food Supply Chain demo.

Usage:
  ./scripts/test-readme-setup.sh [options]

Options:
  --with-viewer      Also run finalize-setup and start Miravi (port 5173).
  --keep-running     Keep services running until interrupted (requires --with-viewer).
  --skip-install     Skip all npm install steps.
  --timeout SEC      Timeout per service readiness check (default: 120).
  -h, --help         Show this help.
EOF
}

require_cmd() {
  local cmd="$1"
  command -v "$cmd" >/dev/null 2>&1 || die "Required command '$cmd' is not available."
}

run_step_in() {
  local name="$1"
  local cwd="$2"
  shift 2
  local logfile="$LOG_DIR/${name}.log"

  log "Running step: $name"
  (
    cd "$cwd"
    "$@"
  ) >"$logfile" 2>&1 || {
    log "Step failed: $name (see $logfile)"
    return 1
  }
}

run_shell_step_in() {
  local name="$1"
  local cwd="$2"
  local script="$3"
  local logfile="$LOG_DIR/${name}.log"

  log "Running step: $name"
  (
    cd "$cwd"
    bash -lc "$script"
  ) >"$logfile" 2>&1 || {
    log "Step failed: $name (see $logfile)"
    return 1
  }
}

start_service_in() {
  local name="$1"
  local cwd="$2"
  shift 2
  local logfile="$LOG_DIR/${name}.log"

  log "Starting service: $name"
  set -m
  (
    cd "$cwd"
    exec "$@"
  ) </dev/null >"$logfile" 2>&1 &

  local pid=$!
  set +m
  SERVICE_NAMES+=("$name")
  SERVICE_PIDS+=("$pid")
  log "Service '$name' started with PID $pid (log: $logfile)"
}

assert_port_available() {
  local host="$1"
  local port="$2"
  local label="$3"

  if (echo >"/dev/tcp/$host/$port") >/dev/null 2>&1; then
    die "$label cannot start because $host:$port is already in use."
  fi
}

wait_for_port() {
  local host="$1"
  local port="$2"
  local label="$3"
  local timeout="$4"
  local start=$SECONDS

  while true; do
    if (echo >"/dev/tcp/$host/$port") >/dev/null 2>&1; then
      log "$label is ready on $host:$port"
      return 0
    fi

    if (( SECONDS - start >= timeout )); then
      die "Timed out waiting for $label on $host:$port. Check logs in $LOG_DIR."
    fi

    sleep 1
  done
}

assert_file_exists() {
  local file="$1"
  [[ -f "$file" ]] || die "Expected file not found: $file"
}

stop_service_group() {
  local pid="$1"

  kill -TERM -- "-$pid" >/dev/null 2>&1 || true
  kill -CONT -- "-$pid" >/dev/null 2>&1 || true

  local attempt
  for attempt in {1..50}; do
    if ! kill -0 -- "-$pid" >/dev/null 2>&1; then
      break
    fi
    sleep 0.1
  done

  if kill -0 -- "-$pid" >/dev/null 2>&1; then
    kill -KILL -- "-$pid" >/dev/null 2>&1 || true
  fi
  wait "$pid" >/dev/null 2>&1 || true
}

cleanup() {
  local status=$?

  if ! $RUN_STARTED; then
    return 0
  fi

  if (( ${#SERVICE_PIDS[@]} > 0 )); then
    log "Stopping background services..."
  fi

  local i
  for (( i=${#SERVICE_PIDS[@]}-1; i>=0; i-- )); do
    local name="${SERVICE_NAMES[$i]}"
    local pid="${SERVICE_PIDS[$i]}"

    if kill -0 -- "-$pid" >/dev/null 2>&1; then
      log "Stopping service '$name' (PID $pid)"
      stop_service_group "$pid"
    fi
  done

  if (( status == 0 )); then
    if $KEEP_RUNNING; then
      log "Viewer services stopped."
    else
      log "README smoke test succeeded."
    fi
  else
    if $KEEP_RUNNING; then
      log "Viewer setup failed. Logs are in: $LOG_DIR"
    else
      log "README smoke test failed. Logs are in: $LOG_DIR"
    fi
  fi
}
trap cleanup EXIT

while (( "$#" )); do
  case "$1" in
    --with-viewer)
      WITH_VIEWER=true
      shift
      ;;
    --keep-running)
      KEEP_RUNNING=true
      shift
      ;;
    --skip-install)
      SKIP_INSTALL=true
      shift
      ;;
    --timeout)
      [[ $# -ge 2 ]] || die "--timeout requires a value in seconds."
      WAIT_TIMEOUT_SEC="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "Unknown argument: $1 (use --help)"
      ;;
  esac
done

if $KEEP_RUNNING && ! $WITH_VIEWER; then
  die "--keep-running requires --with-viewer."
fi

rm -rf "$WORK_DIR"
mkdir -p "$LOG_DIR"
RUN_STARTED=true

require_cmd git
require_cmd npm
require_cmd npx
require_cmd jq
require_cmd curl

if $WITH_VIEWER; then
  require_cmd envsubst
fi

if [[ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]]; then
  # Homebrew may export this through npm, but nvm refuses to run while it is set.
  unset npm_config_prefix
  # shellcheck source=/dev/null
  . "${NVM_DIR:-$HOME/.nvm}/nvm.sh"
fi

if type nvm >/dev/null 2>&1; then
  log "Using Node version from secuweb-anchors/.nvmrc"
  (
    cd "$REPO_ROOT/secuweb-anchors"
    nvm use
  ) >/dev/null
fi

log "Skipping submodule update by design."

if ! $SKIP_INSTALL; then
  run_step_in install-root "$REPO_ROOT" npm i
  run_step_in install-anchors "$REPO_ROOT/secuweb-anchors" npm i
fi

if $WITH_VIEWER; then
  run_shell_step_in finalize-setup "$REPO_ROOT" "source ./env-localhost && ./scripts/setup/finalize-setup.sh"
fi

run_step_in reset-css "$REPO_ROOT" rm -rf css/root

assert_port_available 127.0.0.1 3000 "CSS"
start_service_in css "$REPO_ROOT" npm run pod
wait_for_port 127.0.0.1 3000 "CSS" "$WAIT_TIMEOUT_SEC"

assert_port_available 127.0.0.1 8545 "Hardhat node"
start_service_in hardhat "$REPO_ROOT/secuweb-anchors" npm run node
wait_for_port 127.0.0.1 8545 "Hardhat node" "$WAIT_TIMEOUT_SEC"

run_step_in anchor-setup "$REPO_ROOT/secuweb-anchors" npm run setup

assert_port_available 127.0.0.1 4444 "Verifier service"
start_service_in verifier "$REPO_ROOT/secuweb-anchors" npm run server
wait_for_port 127.0.0.1 4444 "Verifier service" "$WAIT_TIMEOUT_SEC"

if ! $SKIP_INSTALL; then
  run_step_in install-vc "$REPO_ROOT/vc" npm i
fi
run_step_in build-vc "$REPO_ROOT/vc" npm run build

run_step_in validate-fixtures "$REPO_ROOT" npm run fixtures:validate
run_step_in validate-overlays "$REPO_ROOT" npm run fixtures:validate-overlays
run_step_in setup-fixtures "$REPO_ROOT" npm run setup:fixtures
run_step_in bind-actor-identities "$REPO_ROOT" npm run setup:actor-identities
run_step_in publish-catalog "$REPO_ROOT" npm run setup:catalog
run_step_in publish-discoverability "$REPO_ROOT" npm run setup:discoverability
run_step_in anchor-fixtures "$REPO_ROOT" npm run flows:anchor-fixtures

assert_file_exists "$REPO_ROOT/local-run/generated/vcs/farmer/products/vc/product-x.jsonld"
assert_file_exists "$REPO_ROOT/local-run/generated/vcs/packager/products/vc/packaged-batch-001.jsonld"

run_step_in scenarios "$REPO_ROOT" env SCENARIO_TEST_STRICT=false npm run test:scenarios

run_step_in explore-chain "$REPO_ROOT" npm run explore

if $WITH_VIEWER; then
  VIEWER_MAIN="$REPO_ROOT/../food-supply-chain-miravi/main"
  [[ -d "$VIEWER_MAIN" ]] || die "Viewer not found at $VIEWER_MAIN after finalize-setup."

  assert_port_available 127.0.0.1 5173 "Miravi"
  start_service_in miravi "$VIEWER_MAIN" npm run dev -- --host 127.0.0.1 --strictPort
  wait_for_port 127.0.0.1 5173 "Miravi" "$WAIT_TIMEOUT_SEC"
fi

run_step_in verifier-explorer-check "$REPO_ROOT" curl -fsS http://127.0.0.1:4444/explorer/data

log "All checks passed."

if $KEEP_RUNNING; then
  log "Services are running."
  log "Viewer: http://127.0.0.1:5173"
  log "Solid server: http://127.0.0.1:3000"
  log "Verifier: http://127.0.0.1:4444"
  log "Press Ctrl+C to stop all services."

  trap 'log "Shutdown requested."; exit 0' INT TERM
  while true; do
    sleep 3600
  done
fi
