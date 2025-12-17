#!/bin/bash

# CraftLocal Kong CORS Verification Script
# This script tests if CORS is properly configured on your Kong gateway

echo "🔍 CraftLocal Kong CORS Verification"
echo "======================================"
echo ""

# Configuration
KONG_URL="https://api.craftlocal.net"
ORIGIN="https://craftlocal.net"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: OPTIONS preflight request
echo -e "${BLUE}Test 1: CORS Preflight (OPTIONS)${NC}"
echo "Testing: OPTIONS ${KONG_URL}/rest/v1/cities"
echo ""

RESPONSE=$(curl -s -X OPTIONS "${KONG_URL}/rest/v1/cities" \
  -H "Origin: ${ORIGIN}" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: apikey, content-type" \
  -i)

echo "$RESPONSE"
echo ""

# Check for CORS headers
if echo "$RESPONSE" | grep -q "access-control-allow-origin"; then
  ALLOW_ORIGIN=$(echo "$RESPONSE" | grep -i "access-control-allow-origin" | cut -d' ' -f2- | tr -d '\r')
  if [ "$ALLOW_ORIGIN" = "$ORIGIN" ] || [ "$ALLOW_ORIGIN" = "*" ]; then
    echo -e "${GREEN}✓ CORS Allow-Origin header is correct: ${ALLOW_ORIGIN}${NC}"
  else
    echo -e "${YELLOW}⚠ CORS Allow-Origin header found but doesn't match: ${ALLOW_ORIGIN}${NC}"
  fi
else
  echo -e "${RED}✗ CORS Allow-Origin header is missing!${NC}"
fi

if echo "$RESPONSE" | grep -q "access-control-allow-credentials"; then
  echo -e "${GREEN}✓ CORS Allow-Credentials header is present${NC}"
else
  echo -e "${YELLOW}⚠ CORS Allow-Credentials header is missing${NC}"
fi

if echo "$RESPONSE" | grep -q "access-control-allow-methods"; then
  METHODS=$(echo "$RESPONSE" | grep -i "access-control-allow-methods" | cut -d' ' -f2- | tr -d '\r')
  echo -e "${GREEN}✓ CORS Allow-Methods: ${METHODS}${NC}"
else
  echo -e "${RED}✗ CORS Allow-Methods header is missing!${NC}"
fi

echo ""
echo "======================================"
echo ""

# Test 2: Actual GET request
echo -e "${BLUE}Test 2: Actual API Request (GET)${NC}"
echo "Testing: GET ${KONG_URL}/rest/v1/cities?limit=1"
echo ""

ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzM0NDAwMDAwLCJleHAiOjIwNTAwMDAwMDB9.ALT0l4BuD8yD9_TSEpasKyr7IIRuhcEYDqaEUBRBYVM"

RESPONSE=$(curl -s -X GET "${KONG_URL}/rest/v1/cities?limit=1" \
  -H "Origin: ${ORIGIN}" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -i)

echo "$RESPONSE"
echo ""

# Check response
if echo "$RESPONSE" | grep -q "HTTP/[12].[01] 200"; then
  echo -e "${GREEN}✓ API request successful (200 OK)${NC}"
else
  HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP/" | head -1)
  echo -e "${RED}✗ API request failed: ${HTTP_STATUS}${NC}"
fi

if echo "$RESPONSE" | grep -q "access-control-allow-origin"; then
  echo -e "${GREEN}✓ CORS headers present in response${NC}"
else
  echo -e "${RED}✗ CORS headers missing in response!${NC}"
fi

echo ""
echo "======================================"
echo ""

# Test 3: WebSocket connection
echo -e "${BLUE}Test 3: WebSocket Connection${NC}"
echo "Testing: WSS ${KONG_URL}/realtime/v1/websocket"
echo ""

# Note: This is a basic test, full WebSocket testing requires more complex tools
WS_URL=$(echo "$KONG_URL" | sed 's/https:/wss:/' | sed 's/http:/ws:/')
echo "WebSocket URL: ${WS_URL}/realtime/v1/websocket?apikey=${ANON_KEY:0:20}...&vsn=1.0.0"
echo -e "${YELLOW}Note: Full WebSocket testing requires browser or specialized tools${NC}"
echo -e "${YELLOW}Use the test-database-connection.html file for WebSocket testing${NC}"

echo ""
echo "======================================"
echo ""

# Summary
echo -e "${BLUE}Summary${NC}"
echo ""
echo "If all tests passed:"
echo -e "  ${GREEN}✓ Your Kong CORS configuration is correct${NC}"
echo -e "  ${GREEN}✓ Frontend should be able to connect to backend${NC}"
echo ""
echo "If tests failed:"
echo -e "  ${RED}✗ Apply the Kong CORS configuration from kong-cors-config.yml${NC}"
echo -e "  ${RED}✗ See QUICK_START_FIX.md for instructions${NC}"
echo ""
echo "Next steps:"
echo "  1. If CORS is working, deploy frontend changes"
echo "  2. Set environment variables in Cloudflare Pages"
echo "  3. Test at https://craftlocal.net"
echo ""

