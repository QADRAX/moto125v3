# ========= Scan-WP.ps1 =========
$ErrorActionPreference = 'SilentlyContinue'
$Root = "C:\Users\Carlos Qadra\Desktop\New folder\05092025Backup"
$Out  = Join-Path $Root "scan_sospechosos.csv"

# Regex de alto valor para malware PHP y modificadores de index.php
$Patterns = @(
  'file_put_contents\s*\(\s*["'']index\.php["'']',
  'fopen\s*\(\s*["'']index\.php["'']\s*,\s*["'']w',
  '(?<!function\s)eval\s*\(',
  'assert\s*\(',
  'preg_replace\s*\([^)]*?/e',
  'base64_decode\s*\(',
  'gzinflate\s*\(',
  'gzuncompress\s*\(',
  'str_rot13\s*\(',
  'create_function\s*\(',
  'register_shutdown_function\s*\(',
  'ignore_user_abort\s*\(\s*true',
  'curl_(init|exec)\s*\(',
  'fsockopen\s*\(',
  'stream_socket_client\s*\(',
  'php://(input|filter|temp|memory)',
  'include\s*\(\s*\$_(GET|POST|REQUEST|SERVER)\[',
  'goto\s+[A-Za-z0-9_]{6,}',
  'range\(\s*["'']~["'']\s*,\s*["'']\s["'']\s*\)'  # patrón típico de ofuscación
)

function Get-Entropy([byte[]]$bytes) {
  if(-not $bytes -or $bytes.Length -eq 0){ return 0 }
  $counts = @{}
  foreach($b in $bytes){ if($counts.ContainsKey($b)){$counts[$b]++}else{$counts[$b]=1} }
  $len = [double]$bytes.Length
  $H = 0.0
  foreach($c in $counts.Values){ $p = $c/$len; $H += -$p * [math]::Log($p,2) }
  return [math]::Round($H,3)
}

$rows = New-Object System.Collections.Generic.List[Object]

# 2.1 Escanea PHP / PHTML
Get-ChildItem -Path $Root -Recurse -File -Include *.php,*.phtml |
Where-Object { $_.FullName -notmatch '\\wp-content\\cache\\' } |
ForEach-Object {
  $path = $_.FullName
  $txt  = Get-Content -Raw -LiteralPath $path
  $hits = @()
  foreach($pat in $Patterns){
    $m = [regex]::Matches($txt,$pat,[Text.RegularExpressions.RegexOptions]::IgnoreCase)
    if($m.Count -gt 0){ $hits += ("{0}({1})" -f $pat,$m.Count) }
  }
  $bytes = [IO.File]::ReadAllBytes($path)
  $ent   = Get-Entropy $bytes
  if($hits.Count -gt 0 -or $ent -gt 7.2){
    $rows.Add([pscustomobject]@{
      Tipo     = 'PHP'
      Ruta     = $path
      Tam      = $bytes.Length
      Entropia = $ent
      ModTime  = $_.LastWriteTime
      Hits     = ($hits -join ' | ')
    })
  }
}

# 2.2 PHP donde no debe (uploads) + imágenes con código PHP embebido
$uploads = Join-Path $Root 'wp-content\uploads'
if(Test-Path $uploads){
  # PHP en uploads
  Get-ChildItem -Path $uploads -Recurse -File -Include *.php,*.phtml | ForEach-Object {
    $rows.Add([pscustomobject]@{
      Tipo='PHP_en_uploads'; Ruta=$_.FullName; Tam=$_.Length; Entropia=Get-Entropy ([IO.File]::ReadAllBytes($_.FullName))
      ModTime=$_.LastWriteTime; Hits='PHP en uploads'
    })
  }

  # Imágenes con "<?php" dentro
  Get-ChildItem -Path $uploads -Recurse -File -Include *.png,*.jpg,*.jpeg,*.gif,*.ico |
  ForEach-Object {
    $p=$_.FullName
    $bytes=[IO.File]::ReadAllBytes($p)
    $txt=[System.Text.Encoding]::ASCII.GetString($bytes)
    if($txt -match '<\?php'){
      $rows.Add([pscustomobject]@{
        Tipo='IMG_con_PHP'; Ruta=$p; Tam=$bytes.Length; Entropia=Get-Entropy $bytes
        ModTime=$_.LastWriteTime; Hits='<?php en imagen'
      })
    }
  }
}

# 2.3 Ficheros “especiales” y persistencia
Get-ChildItem -Path $Root -Recurse -File -Include .user.ini,php.ini,web.config,.htaccess |
ForEach-Object {
  $t = Get-Content -Raw -LiteralPath $_.FullName
  if($t -match 'auto_prepend_file|auto_append_file|AddHandler|RewriteRule|php_value|php_flag'){
    $rows.Add([pscustomobject]@{
      Tipo='Persistencia'; Ruta=$_.FullName; Tam=$_.Length; Entropia=''
      ModTime=$_.LastWriteTime; Hits='directiva sospechosa'
    })
  }
}

# 2.4 Funciones de escritura sobre index.php en cualquier lado
Select-String -Path (Join-Path $Root '**\*.php') -Pattern 'file_put_contents\s*\(\s*["'']index\.php["'']|fopen\s*\(\s*["'']index\.php["'']\s*,\s*["'']w' -AllMatches -SimpleMatch:$false -Encoding UTF8 |
ForEach-Object {
  $rows.Add([pscustomobject]@{
    Tipo='IndexWriter'; Ruta=$_.Path; Tam=(Get-Item $_.Path).Length; Entropia=''
    ModTime=(Get-Item $_.Path).LastWriteTime; Hits=$_.Matches.Value -join ' | '
  })
}

$rows | Sort-Object Tipo,ModTime | Export-Csv -NoTypeInformation -Encoding UTF8 $Out
Write-Host "`n>> Resultado: $Out"
# ========= /Scan-WP.ps1 =========
