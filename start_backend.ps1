# ============================================================
# T.R.E.X Backend - Resource-Limited Startup Script
# Prevents 99% CPU / Disk spikes on Windows/OneDrive
# ============================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  T.R.E.X Backend - Safe Start Mode" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# --- Step 1: Move to backend folder ---
$backendPath = "$PSScriptRoot\backend"
Set-Location $backendPath

# --- Step 2: Set PYTHONDONTWRITEBYTECODE to stop __pycache__ spam on OneDrive ---
$env:PYTHONDONTWRITEBYTECODE = "1"
$env:PYTHONUNBUFFERED     = "1"

# --- Step 3: Load env vars from .env.development ---
Get-Content ".env.development" | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
        $key   = $matches[1].Trim()
        $value = $matches[2].Trim().Trim('"')
        [System.Environment]::SetEnvironmentVariable($key, $value, "Process")
        Write-Host "  Loaded: $key" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "[1/3] Environment loaded." -ForegroundColor Green

# --- Step 4: Activate venv ---
$venvActivate = "$PSScriptRoot\venv\Scripts\Activate.ps1"
if (Test-Path $venvActivate) {
    & $venvActivate
    Write-Host "[2/3] Virtual environment activated." -ForegroundColor Green
} else {
    Write-Host "[WARN] .venv not found - using system Python." -ForegroundColor Yellow
}

# --- Step 5: Launch Uvicorn with strict resource limits ---
# --workers 1         : Only 1 worker process (not 4 default) - saves CPU
# --timeout-keep-alive 30 : Drop idle connections fast
# --limit-concurrency 5   : Max 5 simultaneous requests
# --backlog 10            : Small queue
# NO --reload             : Reload watches filesystem = kills disk on OneDrive
Write-Host "[3/3] Starting Uvicorn (low-resource mode)..." -ForegroundColor Green
Write-Host ""
Write-Host "  Workers     : 1  (CPU safe)" -ForegroundColor White
Write-Host "  Concurrency : 5  (RAM safe)" -ForegroundColor White
Write-Host "  Reload      : OFF (Disk safe - no OneDrive thrashing)" -ForegroundColor White
Write-Host "  URL         : http://localhost:8000" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

python -m uvicorn app.main:app `
    --host 0.0.0.0 `
    --port 8000 `
    --workers 1 `
    --timeout-keep-alive 30 `
    --limit-concurrency 5 `
    --backlog 10 `
    --log-level info
