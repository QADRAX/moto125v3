param([string]$Container='strapi_postgres')

$ErrorActionPreference = 'Stop'

# Timestamped output file on host
$ts   = Get-Date -Format 'yyyy-MM-dd_HHmmss'
$dump = Join-Path (Get-Location) "$ts-strapi.backup.dump"

# Run pg_dump inside the container (custom, compressed)
docker exec $Container sh -lc 'export PGPASSWORD="$POSTGRES_PASSWORD"; pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc -Z9 -f /tmp/backup.dump'
if ($LASTEXITCODE -ne 0) { throw "pg_dump failed (exit $LASTEXITCODE)" }

# Copy dump from container to host (note the ${Container} to avoid the ':' parsing issue)
docker cp ${Container}:/tmp/backup.dump "$dump"
if ($LASTEXITCODE -ne 0) { throw "docker cp failed (exit $LASTEXITCODE)" }

# Cleanup temp file in container
docker exec $Container rm -f /tmp/backup.dump | Out-Null

Write-Host "✅ Dump created:" $dump
