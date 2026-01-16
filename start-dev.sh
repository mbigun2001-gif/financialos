#!/bin/bash
cd "$(dirname "$0")"
export NODE_OPTIONS="--no-warnings"
export NEXT_TELEMETRY_DISABLED=1
rm -rf .next
node node_modules/.bin/next dev
