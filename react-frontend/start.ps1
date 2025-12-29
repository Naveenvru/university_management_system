# Quick Start Script for React Frontend
# Run this script from the react-frontend directory

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "University Management System - React Frontend" -ForegroundColor Cyan
Write-Host "Quick Setup Script" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if node_modules exists
if (!(Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host ""
    Write-Host "✅ Dependencies installed successfully!" -ForegroundColor Green
} else {
    Write-Host "✅ Dependencies already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Test Login Credentials:" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Admin:   admin@university.edu / admin123" -ForegroundColor White
Write-Host "Faculty: rajesh.kumar@university.edu / password123" -ForegroundColor White
Write-Host "Student: aarav.sharma.cse1@university.edu / password123" -ForegroundColor White
Write-Host ""

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Starting React Development Server..." -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "The app will open automatically at http://localhost:3000" -ForegroundColor White
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor White
Write-Host ""

# Start the development server
npm start
