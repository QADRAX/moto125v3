param(
  [Parameter(Mandatory = $true)]
  [string]$AppName,     # p.ej. moto125-pre (sin .azurewebsites.net)
  [Parameter(Mandatory = $true)]
  [string]$ZipPath,     # ruta al ZIP
  [Parameter(Mandatory = $true)]
  [string]$User,        # del publish profile (ej: $Moto125-PRE)
  [Parameter(Mandatory = $true)]
  [string]$Password     # del publish profile
)

$pair    = "{0}:{1}" -f $User, $Password
$bytes   = [System.Text.Encoding]::ASCII.GetBytes($pair)
$b64     = [System.Convert]::ToBase64String($bytes)
$headers = @{ Authorization = "Basic $b64" }

$uri = "https://$AppName.scm.azurewebsites.net/api/zipdeploy"

Write-Host "Deploying $ZipPath to $AppName..." -ForegroundColor Cyan

try {
  Invoke-RestMethod `
    -Uri $uri `
    -Method Post `
    -Headers $headers `
    -InFile $ZipPath `
    -ContentType "application/zip" `
    -TimeoutSec 600

  Write-Host "Deployment finished." -ForegroundColor Green
}
catch {
  Write-Host "Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
  if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message -ForegroundColor Yellow }
  exit 1
}
