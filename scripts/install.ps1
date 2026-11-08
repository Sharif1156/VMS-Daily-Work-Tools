$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
py -3 -m venv .venv
if ($LASTEXITCODE -ne 0) { throw 'Python 3.11+ is required.' }
& .\.venv\Scripts\python.exe -m pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed.' }
if (!(Test-Path '.env')) {
    function New-Password {
        $bytes = New-Object byte[] 32
        [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
        return [Convert]::ToBase64String($bytes)
    }
    $admin = New-Password
    $employee = New-Password
    @"
DATABASE_URL=sqlite:///./vms.db
ADMIN_PASSWORD=$admin
EMPLOYEE_PASSWORD=$employee
COOKIE_SECURE=false
PORT=8000
"@ | Set-Content .env
    Write-Host "Initial administrator: admin@nafi.it / $admin"
    Write-Host "Initial employee: employee@nafi.it / $employee"
    Write-Warning 'Protect .env using NTFS ACLs. Configure PostgreSQL and HTTPS before production.'
}
Write-Host 'Installation ready. Run .\scripts\start.ps1'
