$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
if (!(Test-Path '.env')) { throw 'Run scripts/install.ps1 first.' }
$portValue = (Get-Content '.env' | Where-Object { $_ -match '^PORT=' }) -replace '^PORT=', ''
if (!$portValue) { $portValue = '8000' }
& .\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port $portValue --env-file .env --no-proxy-headers
exit $LASTEXITCODE
