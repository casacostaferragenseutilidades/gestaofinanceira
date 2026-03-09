# Script PowerShell para aplicar a migração da coluna original_due_date
# Execute: .\scripts\apply-migration.ps1

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Aplicar Migração - Original Due Date" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se psql está disponível
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlPath) {
    Write-Host "[ERRO] psql não encontrado no PATH" -ForegroundColor Red
    Write-Host "Certifique-se de que o PostgreSQL está instalado e no PATH" -ForegroundColor Yellow
    exit 1
}

# Verificar se DATABASE_URL está definida
if (-not $env:DATABASE_URL) {
    Write-Host "[ERRO] Variável DATABASE_URL não definida" -ForegroundColor Red
    Write-Host "Por favor, defina a variável de ambiente DATABASE_URL" -ForegroundColor Yellow
    Write-Host "Exemplo: `$env:DATABASE_URL = 'postgresql://user:pass@host:port/db'" -ForegroundColor Yellow
    exit 1
}

Write-Host "Aplicando migração..." -ForegroundColor Yellow

# Executar o script SQL
$scriptPath = Join-Path $PSScriptRoot "apply-migration.sql"
psql $env:DATABASE_URL -f $scriptPath

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[ERRO] Falha ao aplicar migração" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  ✅ Migração aplicada com sucesso!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
