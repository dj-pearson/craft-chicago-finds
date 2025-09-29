#!/bin/bash
# Force npm usage for Cloudflare Pages
export NPM_CONFIG_PACKAGE_MANAGER_STRICT=true
export NPM_CONFIG_ENGINE_STRICT=true

# Ensure we're using npm
if command -v npm >/dev/null 2>&1; then
    echo "Using npm for package management"
    npm install
    npm run build
else
    echo "npm not found, exiting"
    exit 1
fi
