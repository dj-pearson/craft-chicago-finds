#!/bin/bash

# Script to fix TypeScript error handling in edge functions
# This adds proper error type checking using the getErrorMessage helper

# List of functions that need fixing
functions=(
  "analyze-blog-posts-seo"
  "analyze-content"
  "analyze-internal-links"
  "analyze-semantic-keywords"
  "apply-seo-fixes"
  "check-broken-links"
  "check-core-web-vitals"
  "check-keyword-positions"
  "crawl-site"
  "detect-duplicate-content"
  "detect-redirect-chains"
  "generate-blog-content"
  "gsc-fetch-core-web-vitals"
  "gsc-fetch-properties"
  "gsc-oauth"
  "gsc-sync-data"
  "manage-blog-titles"
  "monitor-performance-budget"
  "optimize-page-content"
  "run-scheduled-audit"
  "send-seo-notification"
  "seo-audit"
  "sync-backlinks"
  "track-serp-positions"
  "validate-structured-data"
)

for func in "${functions[@]}"; do
  file="supabase/functions/$func/index.ts"
  if [ -f "$file" ]; then
    echo "Fixing $func..."
    
    # Add import if not present
    if ! grep -q "getErrorMessage" "$file"; then
      sed -i '3 a import { getErrorMessage } from "../_shared/types.ts";' "$file"
    fi
    
    # Replace error.message with getErrorMessage(error)
    sed -i 's/error\.message/getErrorMessage(error)/g' "$file"
    
    echo "Fixed $func"
  fi
done

echo "All functions fixed!"
