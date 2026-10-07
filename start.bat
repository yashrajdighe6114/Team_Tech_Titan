@echo off
echo ==========================================================
echo        AssetTrust — RWA Tokenization & Settlement Platform
echo ==========================================================
echo Starting AI Verification Service (Port 8001)...
start "AssetTrust AI Service" cmd /k "cd ai-service && python -m uvicorn main:app --host 127.0.0.1 --port 8001"

echo Starting Backend API (Port 5000)...
start "AssetTrust Backend" cmd /k "cd backend && node dist/index.js"

echo Starting Frontend Web App (Port 3000)...
start "AssetTrust Frontend" cmd /k "cd frontend && npm run dev -- --port 3000"

echo.
echo ==========================================================
echo Application launched!
echo Open your browser at: http://localhost:3000
echo Demo login: owner@assettrust.demo / Password123!
echo ==========================================================
pause
