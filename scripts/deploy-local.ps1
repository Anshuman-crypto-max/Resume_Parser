param(
    [switch]$BuildOnly
)

$ErrorActionPreference = "Stop"

docker compose build

if (-not $BuildOnly) {
    docker compose up -d
    docker compose ps
    Write-Host "Frontend: http://localhost:5173"
    Write-Host "Backend health: http://localhost:8000/health"
}
