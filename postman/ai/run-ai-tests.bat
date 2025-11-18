@echo off
echo 🤖 AI API Test Runner
echo ====================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if Newman is installed
newman --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Newman is not installed. Installing...
    npm install -g newman
    if %errorlevel% neq 0 (
        echo ❌ Failed to install Newman. Please install manually: npm install -g newman
        pause
        exit /b 1
    )
)

REM Check if server is running
echo 🔍 Checking server status...
curl -s -o nul -w "%%{http_code}" http://localhost:3000/api/health > temp_response.txt 2>nul
set /p response=<temp_response.txt
del temp_response.txt

if "%response%" neq "200" (
    echo ❌ Server is not running on localhost:3000
    echo Please start the server: npm run dev
    pause
    exit /b 1
)

echo ✅ Server is running
echo.

REM Create results directory
if not exist "results" mkdir results

REM Run AI API Collection
echo 🚀 Running AI API Collection...
newman run "AI_API_Collection.json" -e "AI_API_Environment.json" --reporters cli,json --reporter-json-export "results/AI_API_Collection-results.json"
if %errorlevel% neq 0 (
    echo ❌ AI API Collection tests failed
    pause
    exit /b 1
)

echo ✅ AI API Collection completed successfully
echo.

REM Run AI API Tests Collection
echo 🚀 Running AI API Automated Tests...
newman run "AI_API_Tests_Collection.json" -e "AI_API_Environment.json" --reporters cli,json --reporter-json-export "results/AI_API_Tests_Collection-results.json"
if %errorlevel% neq 0 (
    echo ❌ AI API Automated Tests failed
    pause
    exit /b 1
)

echo ✅ AI API Automated Tests completed successfully
echo.

REM Generate test report
echo 📊 Generating test report...
echo ^<!DOCTYPE html^> > results/test-report.html
echo ^<html^> >> results/test-report.html
echo ^<head^> >> results/test-report.html
echo     ^<title^>AI API Test Report^</title^> >> results/test-report.html
echo     ^<style^> >> results/test-report.html
echo         body { font-family: Arial, sans-serif; margin: 20px; } >> results/test-report.html
echo         .header { background: #f0f0f0; padding: 20px; border-radius: 5px; } >> results/test-report.html
echo         .success { color: green; } >> results/test-report.html
echo         .failure { color: red; } >> results/test-report.html
echo     ^</style^> >> results/test-report.html
echo ^</head^> >> results/test-report.html
echo ^<body^> >> results/test-report.html
echo     ^<div class="header"^> >> results/test-report.html
echo         ^<h1^>🤖 AI API Test Report^</h1^> >> results/test-report.html
echo         ^<p^>Generated on: %date% %time%^</p^> >> results/test-report.html
echo     ^</div^> >> results/test-report.html
echo     ^<div^> >> results/test-report.html
echo         ^<h2^>Test Summary^</h2^> >> results/test-report.html
echo         ^<p^>All AI API tests completed successfully!^</p^> >> results/test-report.html
echo     ^</div^> >> results/test-report.html
echo ^</body^> >> results/test-report.html
echo ^</html^> >> results/test-report.html

echo 📄 Test report generated: results/test-report.html
echo.

REM Final summary
echo 📋 Test Summary
echo ================
echo 🎉 All tests passed successfully!
echo ✅ AI API is working correctly
echo.
echo 📁 Test results saved in: results/
echo 📄 HTML report: results/test-report.html
echo.

pause
