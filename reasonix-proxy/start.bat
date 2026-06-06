@echo off
REM Reasonix Proxy 启动脚本 (Windows)

echo 🚀 启动 Reasonix Proxy Server...

REM 检查 Node.js
node -v >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js 未安装
    echo 请访问 https://nodejs.org 安装
    pause
    exit /b 1
)

REM 安装依赖
if not exist "node_modules" (
    echo 📦 安装依赖...
    call npm install
)

REM 启动服务器
echo ✅ 依赖已准备
call npm start
pause
