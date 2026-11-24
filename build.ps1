$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$manifest = Get-Content (Join-Path $root 'manifest.json') -Raw | ConvertFrom-Json
$version = $manifest.version

$distDir = Join-Path $root 'dist'
$stageDir = Join-Path $distDir 'stage'
$zipPath = Join-Path $distDir "unbook-v$version.zip"

if (Test-Path $stageDir) { Remove-Item $stageDir -Recurse -Force }
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

New-Item -ItemType Directory -Force -Path $stageDir | Out-Null

foreach ($item in @('manifest.json', 'styles.css', 'content.js', 'icons')) {
  Copy-Item -Path (Join-Path $root $item) -Destination $stageDir -Recurse
}

Compress-Archive -Path (Join-Path $stageDir '*') -DestinationPath $zipPath
Remove-Item $stageDir -Recurse -Force

Write-Host "Created $zipPath"
