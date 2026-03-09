@echo off
chcp 65001 >nul
echo ==========================================
echo  Aplicar Migração - Original Due Date
echo ==========================================
echo.

REM Verificar se psql está disponível
where psql >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] psql não encontrado no PATH
    echo Certifique-se de que o PostgreSQL está instalado e no PATH
    pause
    exit /b 1
)

REM Verificar se DATABASE_URL está definida
if "%DATABASE_URL%"=="" (
    echo [ERRO] Variável DATABASE_URL não definida
    echo Por favor, defina a variável de ambiente DATABASE_URL
    echo Exemplo: set DATABASE_URL=postgresql://user:pass@host:port/db
    pause
    exit /b 1
)

echo Aplicando migração...
psql "%DATABASE_URL%" -f scripts\apply-migration.sql

if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha ao aplicar migração
    pause
    exit /b 1
)

echo.
echo ==========================================
echo  ✅ Migração aplicada com sucesso!
echo ==========================================
echo.
pause
