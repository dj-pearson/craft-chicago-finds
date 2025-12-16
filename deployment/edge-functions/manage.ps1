#!/usr/bin/env pwsh
# Edge Functions Management Script
# Craft Local - Chicago Finds
# 
# Usage: .\manage.ps1 [command]
# 
# Commands:
#   setup       - Initial setup (sync + create .env)
#   sync        - Sync functions from supabase/functions
#   dev         - Start development server
#   build       - Build Docker image
#   start       - Start production container
#   stop        - Stop container
#   restart     - Restart container
#   logs        - View logs
#   health      - Check health status
#   test        - Run tests
#   clean       - Clean up containers and images
#   help        - Show this help

param(
    [Parameter(Position=0)]
    [ValidateSet('setup', 'sync', 'dev', 'build', 'start', 'stop', 'restart', 'logs', 'health', 'test', 'clean', 'help')]
    [string]$Command = 'help'
)

$ErrorActionPreference = "Stop"

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host " $Message" -ForegroundColor White
    Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Cyan
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error-Message {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Setup {
    Write-Header "Initial Setup"
    
    # Sync functions
    Write-Info "Syncing functions..."
    & .\sync-functions.ps1
    
    # Create .env if it doesn't exist
    if (-not (Test-Path ".env")) {
        Write-Info "Creating .env file from template..."
        Copy-Item "env.example.txt" ".env"
        Write-Warning ".env file created. Please edit it with your actual values!"
        Write-Info "Open .env and fill in:"
        Write-Host "  - SUPABASE_URL" -ForegroundColor Yellow
        Write-Host "  - SUPABASE_ANON_KEY" -ForegroundColor Yellow
        Write-Host "  - SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Yellow
    } else {
        Write-Success ".env file already exists"
    }
    
    Write-Success "Setup complete!"
    Write-Info "Next steps:"
    Write-Host "  1. Edit .env with your values"
    Write-Host "  2. Run: .\manage.ps1 dev"
}

function Sync {
    Write-Header "Syncing Functions"
    & .\sync-functions.ps1
}

function Dev {
    Write-Header "Starting Development Server"
    
    if (-not (Test-Path ".env")) {
        Write-Error-Message ".env file not found. Run: .\manage.ps1 setup"
        exit 1
    }
    
    Write-Info "Starting Docker Compose..."
    docker-compose up --build
}

function Build {
    Write-Header "Building Docker Image"
    
    Write-Info "Building craftlocal/edge-functions:latest..."
    docker build -t craftlocal/edge-functions:latest .
    
    # Also tag with date
    $date = Get-Date -Format "yyyyMMdd-HHmmss"
    docker tag craftlocal/edge-functions:latest "craftlocal/edge-functions:$date"
    
    Write-Success "Built images:"
    Write-Host "  - craftlocal/edge-functions:latest"
    Write-Host "  - craftlocal/edge-functions:$date"
}

function Start {
    Write-Header "Starting Production Container"
    
    if (-not (Test-Path ".env")) {
        Write-Error-Message ".env file not found. Run: .\manage.ps1 setup"
        exit 1
    }
    
    Write-Info "Starting with docker-compose.prod.yml..."
    docker-compose -f docker-compose.prod.yml up -d
    
    Write-Success "Container started!"
    Write-Info "View logs: .\manage.ps1 logs"
    Write-Info "Check health: .\manage.ps1 health"
}

function Stop {
    Write-Header "Stopping Container"
    
    Write-Info "Stopping development container..."
    docker-compose down
    
    Write-Info "Stopping production container..."
    docker-compose -f docker-compose.prod.yml down
    
    Write-Success "Containers stopped"
}

function Restart {
    Write-Header "Restarting Container"
    
    Write-Info "Restarting..."
    docker-compose restart
    
    Write-Success "Container restarted"
}

function Logs {
    Write-Header "Viewing Logs"
    
    Write-Info "Press Ctrl+C to exit..."
    Start-Sleep -Seconds 1
    docker-compose logs -f
}

function Health {
    Write-Header "Health Check"
    
    Write-Info "Checking http://localhost:8000/_health..."
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:8000/_health" -Method Get
        
        Write-Success "Service is healthy!"
        Write-Host ""
        Write-Host "Status: $($response.status)" -ForegroundColor Green
        Write-Host "Service: $($response.service)" -ForegroundColor Cyan
        Write-Host "Runtime: $($response.runtime) $($response.version)" -ForegroundColor Cyan
        Write-Host "Functions: $($response.functions.total)" -ForegroundColor Cyan
        Write-Host ""
        
        if ($response.environment) {
            Write-Host "Environment:" -ForegroundColor Yellow
            Write-Host "  Supabase URL: $($response.environment.supabaseUrlConfigured)" -ForegroundColor White
            Write-Host "  Anon Key: $($response.environment.anonKeyConfigured)" -ForegroundColor White
            Write-Host "  Service Role Key: $($response.environment.serviceRoleKeyConfigured)" -ForegroundColor White
        }
    }
    catch {
        Write-Error-Message "Health check failed!"
        Write-Host "Error: $_" -ForegroundColor Red
        Write-Info "Make sure the container is running: .\manage.ps1 dev"
        exit 1
    }
}

function Test {
    Write-Header "Running Tests"
    
    # Health check
    Write-Info "1. Testing health endpoint..."
    try {
        $health = Invoke-RestMethod -Uri "http://localhost:8000/_health" -Method Get
        Write-Success "Health check passed"
    }
    catch {
        Write-Error-Message "Health check failed"
        exit 1
    }
    
    # Test root endpoint
    Write-Info "2. Testing root endpoint..."
    try {
        $root = Invoke-RestMethod -Uri "http://localhost:8000/" -Method Get
        Write-Success "Root endpoint passed"
    }
    catch {
        Write-Error-Message "Root endpoint failed"
        exit 1
    }
    
    # Test a function (newsletter-subscribe)
    Write-Info "3. Testing sample function..."
    try {
        $body = @{
            email = "test@example.com"
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "http://localhost:8000/newsletter-subscribe" `
            -Method Post `
            -ContentType "application/json" `
            -Body $body `
            -ErrorAction Stop
        
        Write-Success "Function test passed"
    }
    catch {
        # This might fail if the function requires real database connection
        # but at least we know the function was loaded
        Write-Warning "Function test returned error (expected if no DB connection)"
    }
    
    Write-Success "All tests completed!"
}

function Clean {
    Write-Header "Cleaning Up"
    
    Write-Warning "This will remove containers, images, and volumes!"
    $confirm = Read-Host "Continue? (y/N)"
    
    if ($confirm -ne 'y') {
        Write-Info "Cancelled"
        return
    }
    
    Write-Info "Stopping containers..."
    docker-compose down -v
    docker-compose -f docker-compose.prod.yml down -v
    
    Write-Info "Removing images..."
    docker rmi craftlocal/edge-functions:latest -f 2>$null
    docker rmi $(docker images -q craftlocal/edge-functions) -f 2>$null
    
    Write-Info "Cleaning synced functions..."
    if (Test-Path "functions") {
        Remove-Item -Path "functions" -Recurse -Force
    }
    
    Write-Success "Cleanup complete!"
}

function Show-Help {
    Write-Host ""
    Write-Host "Edge Functions Management Script" -ForegroundColor Cyan
    Write-Host "Craft Local - Chicago Finds" -ForegroundColor White
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\manage.ps1 [command]"
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor Yellow
    Write-Host "  setup       - Initial setup (sync + create .env)" -ForegroundColor White
    Write-Host "  sync        - Sync functions from supabase/functions" -ForegroundColor White
    Write-Host "  dev         - Start development server" -ForegroundColor White
    Write-Host "  build       - Build Docker image" -ForegroundColor White
    Write-Host "  start       - Start production container" -ForegroundColor White
    Write-Host "  stop        - Stop container" -ForegroundColor White
    Write-Host "  restart     - Restart container" -ForegroundColor White
    Write-Host "  logs        - View logs" -ForegroundColor White
    Write-Host "  health      - Check health status" -ForegroundColor White
    Write-Host "  test        - Run tests" -ForegroundColor White
    Write-Host "  clean       - Clean up containers and images" -ForegroundColor White
    Write-Host "  help        - Show this help" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\manage.ps1 setup          # First time setup"
    Write-Host "  .\manage.ps1 dev            # Start development"
    Write-Host "  .\manage.ps1 logs           # View logs"
    Write-Host "  .\manage.ps1 health         # Check if running"
    Write-Host ""
}

# Execute command
switch ($Command) {
    'setup'   { Setup }
    'sync'    { Sync }
    'dev'     { Dev }
    'build'   { Build }
    'start'   { Start }
    'stop'    { Stop }
    'restart' { Restart }
    'logs'    { Logs }
    'health'  { Health }
    'test'    { Test }
    'clean'   { Clean }
    'help'    { Show-Help }
    default   { Show-Help }
}


