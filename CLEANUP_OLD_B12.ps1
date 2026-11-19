$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot

$obsoletePaths = @(
  'src\b12Context.json',
  'src\b12Context.txt',
  'src\components\RequiredB12HeadScripts.astro',
  'src\components\RequiredB12FooterScripts.astro',
  'src\components\B12Link.astro',
  'src\components\recaptcha',
  'src\lib\b12-i18n.ts',
  'src\lib\forms.ts',
  'src\lib\recaptcha.ts',
  'src\plugins\source-info-integration.mjs',
  'src\data\vechicles.js',
  'public\robots-staging.txt'
)

foreach ($relativePath in $obsoletePaths) {
  $target = Join-Path $root $relativePath
  if (Test-Path -LiteralPath $target) {
    Remove-Item -LiteralPath $target -Recurse -Force
    Write-Host "Removed obsolete file/folder: $relativePath"
  }
}

$pluginDirectory = Join-Path $root 'src\plugins'
if ((Test-Path -LiteralPath $pluginDirectory) -and
    -not (Get-ChildItem -LiteralPath $pluginDirectory -Force | Select-Object -First 1)) {
  Remove-Item -LiteralPath $pluginDirectory -Force
}

# The supplied archive contained a duplicate Git clone nested inside the project.
# Preserve it outside the repository instead of permanently deleting it.
$nestedClone = Join-Path $root 'neghinkhodro'
if (Test-Path -LiteralPath $nestedClone) {
  $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  $backupPath = Join-Path (Split-Path $root -Parent) "neghinkhodro-nested-backup-$stamp"
  Move-Item -LiteralPath $nestedClone -Destination $backupPath
  Write-Host "Moved nested duplicate project to: $backupPath"
}

Write-Host ''
Write-Host 'B12 cleanup completed. The repository .git folder was not changed.'
Write-Host 'Next: npm install, then git status --short.'
