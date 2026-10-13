set shell := ["bash", "-euo", "pipefail", "-c"]

mod api 'apps/api/justfile'
mod mobile 'apps/mobile/justfile'
mod web 'apps/web/justfile'

# Run fix + gate across all workspaces
[group('quality')]
[default]
full: fix gate

# Apply auto-fixes (prettier + eslint) across all workspaces
[group('quality')]
fix:
    bunx turbo run fix

# Run lint + typecheck + tests across all workspaces
[group('quality')]
gate:
    bunx turbo run lint typecheck test

# Run all test suites
[group('quality')]
test:
    bunx turbo run test

# Start Postgres + Redis containers
[group('database')]
db-up:
    docker compose up -d

# Stop containers
[group('database')]
db-down:
    docker compose down

# Destroy volumes and restart containers
[group('database')]
db-reset:
    docker compose down -v
    docker compose up -d

# Tail database container logs
[group('database')]
db-logs:
    docker compose logs -f

# Show running database containers
[group('database')]
db-ps:
    docker compose ps

# Deploy API service to Railway
[group('deploy')]
api-deploy:
    railway up --service patty-api

# Deploy web service to Railway
[group('deploy')]
web-deploy:
    railway up --service patty-web

# Install all workspace dependencies
[group('dev')]
install:
    bun install

# Update all workspace dependencies
[group('dev')]
update:
    bun update

# Remove all node_modules, build artifacts, and lock files
[group('dev')]
clean:
    rm -rf node_modules apps/*/node_modules apps/*/.expo apps/*/dist apps/*/env.local bun.lock apps/*/bun.lock

# Generate location migration SQL from GADM GeoJSON data.
# See scripts/generate-location-sql.ts for download instructions.
[group('data')]
generate-location-sql:
    bun run scripts/generate-location-sql.ts

# Kill any running Android emulator
[group('android')]
emulator-kill:
    adb devices | grep emulator | cut -f1 | xargs -I {} adb -s {} emu kill || true

# Start Android emulator (patty_test AVD)
[group('android')]
emulator:
    QT_QPA_PLATFORM=xcb ~/Android/Sdk/emulator/emulator -avd patty_test &

# List connected Android devices
[group('android')]
emulator-list:
    adb devices
