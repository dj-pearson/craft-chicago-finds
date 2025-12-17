@echo off
REM CraftLocal Kong CORS Verification Script (Windows)
REM This script tests if CORS is properly configured on your Kong gateway

echo.
echo ========================================
echo CraftLocal Kong CORS Verification
echo ========================================
echo.

SET KONG_URL=https://api.craftlocal.net
SET ORIGIN=https://craftlocal.net
SET ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzM0NDAwMDAwLCJleHAiOjIwNTAwMDAwMDB9.ALT0l4BuD8yD9_TSEpasKyr7IIRuhcEYDqaEUBRBYVM

echo Test 1: CORS Preflight (OPTIONS)
echo Testing: OPTIONS %KONG_URL%/rest/v1/cities
echo.

curl -X OPTIONS "%KONG_URL%/rest/v1/cities" ^
  -H "Origin: %ORIGIN%" ^
  -H "Access-Control-Request-Method: GET" ^
  -H "Access-Control-Request-Headers: apikey, content-type" ^
  -i

echo.
echo ========================================
echo.

echo Test 2: Actual API Request (GET)
echo Testing: GET %KONG_URL%/rest/v1/cities?limit=1
echo.

curl -X GET "%KONG_URL%/rest/v1/cities?limit=1" ^
  -H "Origin: %ORIGIN%" ^
  -H "apikey: %ANON_KEY%" ^
  -H "Content-Type: application/json" ^
  -i

echo.
echo ========================================
echo.

echo Summary:
echo.
echo If you see "access-control-allow-origin: %ORIGIN%" in the responses:
echo   [OK] Your Kong CORS configuration is correct
echo   [OK] Frontend should be able to connect to backend
echo.
echo If you don't see CORS headers:
echo   [ERROR] Apply the Kong CORS configuration from kong-cors-config.yml
echo   [ERROR] See QUICK_START_FIX.md for instructions
echo.
echo Next steps:
echo   1. If CORS is working, deploy frontend changes
echo   2. Set environment variables in Cloudflare Pages
echo   3. Test at https://craftlocal.net
echo.
echo ========================================
echo.

pause

