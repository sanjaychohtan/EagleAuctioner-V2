# Automated PostgreSQL Backup Script for Eagle Auctioner (Windows PowerShell)
$ErrorActionPreference = "Stop"

$BackupDir = if ($env:BACKUP_DIR) { $env:BACKUP_DIR } else { ".\backups" }
$ContainerName = if ($env:CONTAINER_NAME) { $env:CONTAINER_NAME } else { "eagle-auctioner-prod-db" }
$DbUser = if ($env:DB_USER) { $env:DB_USER } else { "postgres" }
$DbName = if ($env:DB_NAME) { $env:DB_NAME } else { "eagleauctioner" }
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $BackupDir "eagleauctioner_backup_$Timestamp.sql"
$RetentionDays = if ($env:RETENTION_DAYS) { [int]$env:RETENTION_DAYS } else { 30 }

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

Write-Host "[$((Get-Date).ToString('u'))] Starting PostgreSQL database backup..."
docker exec -t $ContainerName pg_dump -U $DbUser -d $DbName | Out-File -FilePath $BackupFile -Encoding utf8

Write-Host "[$((Get-Date).ToString('u'))] Backup completed successfully: $BackupFile"

# Cleanup backups older than RetentionDays
$CutoffDate = (Get-Date).AddDays(-$RetentionDays)
Get-ChildItem -Path $BackupDir -Filter "eagleauctioner_backup_*.sql" | Where-Object { $_.LastWriteTime -lt $CutoffDate } | Remove-Item -Force
Write-Host "[$((Get-Date).ToString('u'))] Backup maintenance completed."
