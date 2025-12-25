@echo off
echo Building Angular app...
node "node_modules/@angular/cli/bin/ng" build

if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b %errorlevel%
)

echo.
echo Build successful! Deploying to Firebase...
echo.

firebase deploy

if %errorlevel% neq 0 (
    echo Deployment failed!
    pause
    exit /b %errorlevel%
)

echo.
echo ========================================
echo Deployment successful!
echo ========================================
echo.
echo Now open the Firebase URL on your Android device in Chrome to test NFC!
echo.
pause
