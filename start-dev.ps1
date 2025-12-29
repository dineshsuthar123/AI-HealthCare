# AI-HealthCare Development Startup Script
# This script starts all required services for development

Write-Host "🏥 Starting AI-HealthCare Development Environment..." -ForegroundColor Cyan
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Start Hardhat node in background
Write-Host "⛓️  Starting local blockchain (Hardhat)..." -ForegroundColor Yellow
$hardhatJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npx hardhat node
}

# Wait for Hardhat to start
Start-Sleep -Seconds 5

# Deploy contract
Write-Host "📄 Deploying smart contract..." -ForegroundColor Yellow
npx hardhat run scripts/deploy.js --network localhost

# Start the main server
Write-Host ""
Write-Host "🚀 Starting Next.js server with WebSocket support..." -ForegroundColor Green
Write-Host ""
node server.js
