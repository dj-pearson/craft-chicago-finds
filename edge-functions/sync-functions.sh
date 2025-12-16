#!/bin/bash
# Bash Script to Sync Edge Functions
# Copies functions from supabase/functions to deployment/edge-functions/functions
# Craft Local - Chicago Finds

set -e

echo "🔄 Syncing Edge Functions..."
echo ""

# Paths
SOURCE_DIR="../../supabase/functions"
TARGET_DIR="./functions"

# Check if source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ Source directory not found: $SOURCE_DIR"
    exit 1
fi

# Create target directory if it doesn't exist
if [ ! -d "$TARGET_DIR" ]; then
    echo "📁 Creating functions directory..."
    mkdir -p "$TARGET_DIR"
fi

# Clear target directory (except _shared)
echo "🧹 Cleaning target directory..."
find "$TARGET_DIR" -mindepth 1 -maxdepth 1 -type d ! -name "_shared" -exec rm -rf {} +
echo ""

# Copy functions
echo "📦 Copying functions..."
FUNCTION_COUNT=0

for dir in "$SOURCE_DIR"/*; do
    if [ -d "$dir" ]; then
        FUNCTION_NAME=$(basename "$dir")
        
        # Skip hidden directories
        if [[ "$FUNCTION_NAME" == .* ]]; then
            continue
        fi
        
        echo "   → $FUNCTION_NAME"
        cp -r "$dir" "$TARGET_DIR/"
        ((FUNCTION_COUNT++))
    fi
done

echo ""
echo "✅ Successfully synced $FUNCTION_COUNT function(s)"
echo ""

# List synced functions
echo "📋 Available functions:"
for dir in "$TARGET_DIR"/*; do
    if [ -d "$dir" ]; then
        echo "   - $(basename "$dir")"
    fi
done

echo ""
echo "✨ Sync complete!"
echo ""
echo "Next steps:"
echo "1. Review .env configuration"
echo "2. Build: docker-compose build"
echo "3. Start: docker-compose up"
echo "4. Test: curl http://localhost:8000/_health"

# Make script executable
chmod +x "$0" 2>/dev/null || true
