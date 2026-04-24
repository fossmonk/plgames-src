# Set error action to stop on any failure
$ErrorActionPreference = "Stop"

Write-Host "--- Starting Project Setup ---" -ForegroundColor Cyan

# 1. Setup Backend (Python)
Write-Host "`n[1/2] Setting up Python Backend..." -ForegroundColor Green
cd backend

if (!(Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Use the full path to the venv's pip to avoid activation issues
$pipPath = Join-Path $PWD "venv\Scripts\pip.exe"
& $pipPath install --upgrade pip
& $pipPath install -r requirements.txt

cd ..

# 2. Setup Frontend (Node/React)
Write-Host "`n[2/2] Setting up Frontend..." -ForegroundColor Green

# Create Frontend if it doesn't exist
if (!(Test-Path "frontend")) {
    Write-Host "Scaffolding Vite Project..." -ForegroundColor Yellow
    npm create vite@latest frontend -- --template react-ts
}

cd frontend

# Install dependencies and router in one go
Write-Host "Installing dependencies (npm)..." -ForegroundColor Yellow
npm install
npm install react-router-dom
npm install fuse.js

cd ..

Write-Host "`n--- Setup Complete! ---" -ForegroundColor Cyan
Write-Host "To start the project, run: run.bat" -ForegroundColor Yellow