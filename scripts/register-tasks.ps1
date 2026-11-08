# Run in elevated PowerShell. Tasks run as the current Windows service account.
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$startup = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -File `"$root\scripts\start.ps1`"" -WorkingDirectory $root
$backup = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -File `"$root\scripts\backup.ps1`"" -WorkingDirectory $root
$settings = New-ScheduledTaskSettingsSet -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero) -StartWhenAvailable
Register-ScheduledTask -TaskName 'NAFi VMS' -Action $startup -Trigger (New-ScheduledTaskTrigger -AtStartup) -Settings $settings -Description 'NAFi iT VMS web application' -RunLevel Limited
Register-ScheduledTask -TaskName 'NAFi VMS Backup' -Action $backup -Trigger (New-ScheduledTaskTrigger -Daily -At '02:00') -Description 'Daily consistent VMS database backup' -RunLevel Limited
Write-Host 'Configure both tasks in Task Scheduler to run whether the dedicated service account is logged on or not, then test a reboot and backup.'
