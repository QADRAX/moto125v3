<# 
Restore-Db.ps1
Restaura un dump de PostgreSQL en un contenedor Docker existente leyendo credenciales de .env (raíz).
- Formatos soportados:
  * .sql            -> psql -f
  * .dump/.backup   -> pg_restore
  * .sql.gz         -> gunzip -c | psql
  * .dump.gz/.backup.gz -> gunzip -c | pg_restore -F c -
- Variables del .env: 
    DATABASE_NAME, DATABASE_USERNAME, DATABASE_PASSWORD, DATABASE_PORT (opcional)
    POSTGRES_CONTAINER (opcional, por defecto: strapi_postgres)
    DB_DUMP_PATH (opcional; si no, .\db\backup.dump)
#>

[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [string]$EnvPath = ".\.env",   # ruta .env
    [string]$DumpPath,            # si no se pasa, usa DB_DUMP_PATH o .\db\backup.dump
    [switch]$Force,
    [int]$TimeoutSec = 120
)

function Write-Info($m) { Write-Host "[restore] $m" -ForegroundColor Cyan }
function Write-OK($m)  { Write-Host "[restore] $m" -ForegroundColor Green }
function Write-Err($m) { Write-Host "[restore] $m" -ForegroundColor Red }

function Parse-DotEnv([string]$path) {
    if (-not (Test-Path -LiteralPath $path)) { throw "No existe el .env en $path" }
    $map = @{}
    Get-Content -LiteralPath $path | ForEach-Object {
        $line = $_.Trim()
        if ($line -eq "" -or $line.StartsWith("#")) { return }
        if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$') {
            $k = $Matches[1]; $v = $Matches[2]
            if (($v.StartsWith('"') -and $v.EndsWith('"')) -or ($v.StartsWith("'") -and $v.EndsWith("'"))) {
                $v = $v.Substring(1, $v.Length - 2)
            }
            $map[$k] = $v
        }
    }
    return $map
}

try {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        throw "Docker no está disponible en el PATH."
    }

    $envMap = Parse-DotEnv -path $EnvPath

    $ContainerName = if ($envMap.ContainsKey("POSTGRES_CONTAINER")) { $envMap["POSTGRES_CONTAINER"] } else { "strapi_postgres" }
    $DbName     = $envMap["DATABASE_NAME"]
    $DbUser     = $envMap["DATABASE_USERNAME"]
    $DbPassword = $envMap["DATABASE_PASSWORD"]
    $DbPort     = if ($envMap.ContainsKey("DATABASE_PORT")) { [int]$envMap["DATABASE_PORT"] } else { 5432 }
    if (-not $DumpPath) {
        $DumpPath = if ($envMap.ContainsKey("DB_DUMP_PATH")) { $envMap["DB_DUMP_PATH"] } else { ".\db\backup.dump" }
    }

    if ([string]::IsNullOrWhiteSpace($DbName) -or [string]::IsNullOrWhiteSpace($DbUser) -or [string]::IsNullOrWhiteSpace($DbPassword)) {
        throw "Faltan variables en .env (DATABASE_NAME / DATABASE_USERNAME / DATABASE_PASSWORD)."
    }
    if (-not (Test-Path -LiteralPath $DumpPath)) {
        throw "No existe el dump en ruta: $DumpPath"
    }

    Write-Info "Usando: Container='$ContainerName', DB='$DbName', User='$DbUser', Port=$DbPort, Dump='$DumpPath'"

    $exists = docker ps -a --format '{{.Names}}' | Where-Object { $_ -eq $ContainerName }
    if (-not $exists) { throw "No existe el contenedor '$ContainerName'." }
    $running = (docker inspect -f '{{.State.Running}}' $ContainerName 2>$null)
    if ($running -ne 'true') { throw "El contenedor '$ContainerName' no está en ejecución." }

    if (-not $Force) {
        $ans = Read-Host "Esto restaurará objetos en la BD '$DbName' del contenedor '$ContainerName'. ¿Continuar? (y/N)"
        if ($ans -notmatch '^(y|Y|yes|YES)$') { Write-Info "Cancelado."; exit 1 }
    }

    # Esperar readiness
    Write-Info "Esperando a que PostgreSQL esté listo (pg_isready)…"
    $deadline = [DateTime]::UtcNow.AddSeconds($TimeoutSec)
    $ready = $false
    while ([DateTime]::UtcNow -lt $deadline) {
        docker exec --env "PGPASSWORD=$DbPassword" $ContainerName sh -lc "pg_isready -h localhost -p $DbPort -U $DbUser -d $DbName" | Out-Null
        if ($LASTEXITCODE -eq 0) { $ready = $true; break }
        Start-Sleep -Seconds 2
    }
    if (-not $ready) { throw "Timeout esperando a PostgreSQL ($TimeoutSec s)." }
    Write-OK "PostgreSQL listo."

    # Determinar formato por extensión (incluye .gz)
    $fileName    = [System.IO.Path]::GetFileName($DumpPath)
    $lowerName   = $fileName.ToLower()
    $ext         = [System.IO.Path]::GetExtension($lowerName)     # .gz o .sql/.dump/.backup
    $innerExt    = ""
    if ($ext -eq ".gz") {
        $innerExt = [System.IO.Path]::GetExtension([System.IO.Path]::GetFileNameWithoutExtension($lowerName))  # .sql/.dump/.backup
    }

    # Ruta en contenedor
    $remotePath = "/tmp/$fileName"

    Write-Info "Copiando dump al contenedor: $DumpPath -> ${ContainerName}:$remotePath"
    docker cp "$DumpPath" "${ContainerName}:$remotePath" | Out-Null

    # Construir comando de restore según tipo
    $restoreCmd = $null
    if ($ext -eq ".gz") {
        if ($innerExt -eq ".sql") {
            # .sql.gz -> descomprimir y pipe a psql
            $restoreCmd = "gunzip -c $remotePath | psql -h localhost -p $DbPort -U $DbUser -d $DbName -v ON_ERROR_STOP=1"
        } elseif ($innerExt -eq ".dump" -or $innerExt -eq ".backup") {
            # .dump.gz / .backup.gz -> descomprimir y pipe a pg_restore (formato custom)
            $restoreCmd = "gunzip -c $remotePath | pg_restore -F c --verbose --clean --if-exists --no-owner --no-privileges -h localhost -p $DbPort -U $DbUser -d $DbName -"
        } else {
            throw "Extensión no soportada: $fileName (se esperaba .sql.gz, .dump.gz o .backup.gz)"
        }
    } else {
        switch ($ext) {
            ".sql"    { $restoreCmd = "psql -h localhost -p $DbPort -U $DbUser -d $DbName -v ON_ERROR_STOP=1 -f $remotePath" }
            ".dump"   { $restoreCmd = "pg_restore --verbose --clean --if-exists --no-owner --no-privileges -h localhost -p $DbPort -U $DbUser -d $DbName $remotePath" }
            ".backup" { $restoreCmd = "pg_restore --verbose --clean --if-exists --no-owner --no-privileges -h localhost -p $DbPort -U $DbUser -d $DbName $remotePath" }
            default   { throw "Extensión no soportada: $fileName (usa .sql, .dump, .backup, .sql.gz, .dump.gz, .backup.gz)" }
        }
    }

    Write-Info "Ejecutando restore dentro del contenedor…"
    docker exec --env "PGPASSWORD=$DbPassword" -i $ContainerName sh -lc "$restoreCmd"
    if ($LASTEXITCODE -ne 0) { throw "Falló el comando de restore. ExitCode=$LASTEXITCODE" }

    # Limpieza
    docker exec $ContainerName sh -lc "rm -f $remotePath" | Out-Null
    Write-OK "Restore completado con éxito."
}
catch {
    Write-Err $_.Exception.Message
    exit 1
}
