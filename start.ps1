# AssetTrust - One-click Start Script for Windows
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "       AssetTrust — RWA Tokenization & Settlement Platform" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Start Python FastAPI AI Verification Service
Write-Host "`n[1/3] Starting Python FastAPI AI Verification Service on port 8001..." -ForegroundColor Yellow
$aiProcess = Start-Process python -ArgumentList "-m uvicorn main:app --host 127.0.0.1 --port 8001" -WorkingDirectory "$PSScriptRoot\ai-service" -PassThru

# 2. Start Node.js Express Backend
Write-Host "[2/3] Starting AssetTrust Backend API on port 5000..." -ForegroundColor Yellow
$backendProcess = Start-Process node -ArgumentList "dist/index.js" -WorkingDirectory "$PSScriptRoot\backend" -PassThru

# 3. Start React Vite Frontend
Write-Host "[3/3] Starting React Vite Frontend on port 3000..." -ForegroundColor Yellow
$frontendProcess = Start-Process npm -ArgumentList "run dev -- --port 3000" -WorkingDirectory "$PSScriptRoot\frontend" -PassThru

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "✅ AssetTrust Services are running!" -ForegroundColor Green
Write-Host "🌐 Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "🔌 Backend API: http://localhost:5000/api" -ForegroundColor White
Write-Host "🧠 AI Service: http://127.0.0.1:8001" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Demo Accounts: owner@assettrust.demo / Password123!" -ForegroundColor Yellow
Write-Host "Press Ctrl+C or close terminal windows to stop."
