#!/bin/bash

# Reasonix Proxy 启动脚本 (macOS/Linux)

echo "🚀 启动 Reasonix Proxy Server..."

cd "$(dirname "$0")"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装"
    echo "请访问 https://nodejs.org 安装"
    exit 1
fi

# 安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 启动服务器
echo "✅ 依赖已准备"
npm start
