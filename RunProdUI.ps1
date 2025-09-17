
# Ruta del repo root (donde está tu .env)
$root = $PSScriptRoot
$envFile = Join-Path $root ".env"

if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*#') { return }  # ignorar comentarios
        if ($_ -match '^\s*$') { return }  # ignorar líneas vacías
        if ($_ -match '^\s*([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $val = $matches[2].Trim('"').Trim("'")
            Set-Item -Path "Env:$key" -Value $val
        }
    }
} else {
    Write-Host "⚠ No se encontró .env en $envFile"
}

# Defaults si no existen en el .env
if (-not $env:NODE_ENV) { $env:NODE_ENV = "production" }
if (-not $env:PORT) { $env:PORT = "3000" }

# Ejecutar el server.js del standalone
$server = "apps\moto125-ui\.next\standalone\apps\moto125-ui\server.js"
Write-Host "[standalone] starting $server"
node $server
