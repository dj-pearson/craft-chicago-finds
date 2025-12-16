#!/bin/bash
# Complete Deployment (Run this ON the remote server)
# Usage: ./deploy-all-remote.sh

echo ""
echo "╔════════════════════════════════════════╗"
echo "║   COMPLETE SUPABASE DEPLOYMENT         ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Load .env
if [ -f ../.env ]; then
    export $(cat ../.env | grep -v '^#' | xargs)
else
    echo "Error: .env file not found"
    exit 1
fi

# Step 1: Migrations
echo "═══ Step 1: Database Migrations ═══"
echo ""
./deploy-migrations-remote.sh
if [ $? -ne 0 ]; then
    echo "Migration failed. Stopping."
    exit 1
fi

# Step 2: Restart Edge Functions (if container specified)
if [ ! -z "$EDGE_FUNCTIONS_CONTAINER" ]; then
    echo ""
    echo "═══ Step 2: Restart Edge Functions ═══"
    echo ""
    echo "Restarting container: $EDGE_FUNCTIONS_CONTAINER"
    docker restart $EDGE_FUNCTIONS_CONTAINER
    
    echo "Waiting for container to be healthy..."
    sleep 10
    
    status=$(docker ps --filter name=$EDGE_FUNCTIONS_CONTAINER --format '{{.Status}}')
    echo "Container status: $status"
fi

# Step 3: Verify
echo ""
echo "═══ Step 3: Verification ═══"
echo ""

if [ ! -z "$EDGE_FUNCTIONS_URL" ]; then
    echo "Testing Edge Functions..."
    curl -s "$EDGE_FUNCTIONS_URL/_health" | python3 -m json.tool 2>/dev/null || curl -s "$EDGE_FUNCTIONS_URL/_health"
fi

echo ""
echo "╔════════════════════════════════════════╗"
echo "║       DEPLOYMENT COMPLETE! 🚀          ║"
echo "╚════════════════════════════════════════╝"
echo ""

