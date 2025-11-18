@echo off
echo ========================================
echo    New Features API Tests
echo ========================================
echo.

echo Starting API tests...
echo Make sure the server is running on http://localhost:3000
echo.

node run-new-features-tests.js

echo.
echo ========================================
echo Tests completed!
echo ========================================
pause
