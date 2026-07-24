# PostgreSQL Restore Script for Eagle Auctioner (Windows PowerShell)
param (
    [Parameter(Mandatory=$true)]
    [string]$BackupFile
)

$ErrorActionPreference = "Stop"
$ContainerName = if ($env:CONTAINER_NAME) { $env:CONTAINER_NAME } else { "eagle-auctioner-prod-db" }
$DbUser = if ($env:DB_USER) { $env:DB_USER } else { "postgres" }
$DbName = if ($env:DB_NAME) { $env:DB_NAME } else { "eagleauctioner" }

if (-not (Test-Path $BackupFile)) {
    Write-Error "Error: Backup file not found: $BackupFile"
    exit 1
}

Write-Host "[$((Get-Date).ToString('u'))] Restoring PostgreSQL database from $BackupFile..."
Get-Content $BackupFile | docker exec -i $ContainerName psql -U $DbUser -d $DbName

Write-Host "[$((Get-Date).ToString('u'))] Database restoration completed successfully."
