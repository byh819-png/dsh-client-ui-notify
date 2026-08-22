# install.ps1 - install dsh-client-ui-notify into the local dsh web profile.
# Idempotent: safe to re-run. Touches only two locations:
#   1) $DSH_HOME\profiles\node_modules\@deepseek-ai\dsh-client-ui-notify\
#   2) $DSH_HOME\profiles\web\cordis.patch.yml (appends the loader row if missing)
# The patch edit is YAML-validated after it is written; a failed check rolls
# the appended block back and exits with an error instead of breaking dsh boot.
# The window stays open at the end so the restart reminder is visible.
# Usage:  powershell -ExecutionPolicy Bypass -File .\install.ps1

$ErrorActionPreference = 'Stop'

# Locate DSH_HOME
if ($env:DSH_HOME -and (Test-Path $env:DSH_HOME)) {
  $dshHome = $env:DSH_HOME
} else {
  $dshHome = Join-Path $HOME '.dsh'
}
if (-not (Test-Path $dshHome)) {
  Write-Host "ERROR: DSH_HOME not found: $dshHome. Run dsh once (e.g. 'dsh web') or set the DSH_HOME environment variable." -ForegroundColor Red
  Read-Host 'Press Enter to exit'
  exit 1
}

# Validate the patch file: every top-level (non-indented, non-comment) line
# must be a YAML list item, and the loader row for this plugin must be present
# with its name line. This is a structural check tailored to dsh patch files,
# which are top-level YAML lists.
function Test-PatchYaml {
  param(
    [string]$Path,
    [string]$RowId
  )
  $lines = @(Get-Content $Path)
  $meaningful = @($lines | Where-Object { $t = $_.Trim(); $t -ne '' -and -not $t.StartsWith('#') })
  $bad = @()
  foreach ($line in $meaningful) {
    $trimmed = $line.Trim()
    if ($trimmed -eq '[]' -or $trimmed -eq '{}') {
      # An empty container is legal YAML only on its own; beside other items
      # it breaks the stream (items after a flow-style empty list are invalid).
      if ($meaningful.Count -gt 1) { $bad += $line }
      continue
    }
    if ($line -notmatch '^\s') {
      # Top-level line: must be a list item.
      if ($line -notmatch '^- ') { $bad += $line }
    }
  }
  $hasRow = @($lines | Where-Object { $_ -match "^\s*- id:\s+$([regex]::Escape($RowId))\s*$" }).Count -gt 0
  $hasName = @($lines | Where-Object { $_ -match "^\s+name:\s+'@deepseek-ai/dsh-client-ui-notify'\s*$" }).Count -gt 0
  return ($bad.Count -eq 0 -and $hasRow -and $hasName)
}

# 1) Copy the plugin package into the installation closure fallback directory
$pkgRel = Join-Path 'profiles' (Join-Path 'node_modules' (Join-Path '@deepseek-ai' 'dsh-client-ui-notify'))
$pkgDir = Join-Path $dshHome $pkgRel
$srcDir = Join-Path $PSScriptRoot 'package'
if (-not (Test-Path $srcDir)) {
  Write-Host "ERROR: package directory not found: $srcDir (extract the whole archive first)" -ForegroundColor Red
  Read-Host 'Press Enter to exit'
  exit 1
}

New-Item -ItemType Directory -Path (Split-Path $pkgDir) -Force | Out-Null
if (Test-Path $pkgDir) {
  Write-Host "[1/3] Plugin directory already exists; overwriting: $pkgDir"
  Remove-Item $pkgDir -Recurse -Force
}
Copy-Item -Recurse $srcDir $pkgDir
Write-Host "[1/3] Plugin copied to $pkgDir"

# 2) Append the loader row to the web profile user layer
$profileDir = Join-Path $dshHome (Join-Path 'profiles' 'web')
if (-not (Test-Path $profileDir)) {
  Write-Host "ERROR: web profile not found: $profileDir" -ForegroundColor Red
  Read-Host 'Press Enter to exit'
  exit 1
}
$patchFile = Join-Path $profileDir 'cordis.patch.yml'
if (-not (Test-Path $patchFile)) {
  Set-Content -Path $patchFile -Value '[]' -Encoding UTF8
}
$patch = Get-Content $patchFile -Raw
if ($patch -match 'dsh-client-ui-notify') {
  Write-Host '[2/3] cordis.patch.yml already contains the plugin row; skipping'
} else {
  $block = @"

# Notification plugin: rings and shows a popup on answer-complete and
# authorization-needed edges; optional browser system notifications.
- insert:
    - id: ui-notify
      name: '@deepseek-ai/dsh-client-ui-notify'
"@
  # A flow-style empty list ([]) cannot have block items appended after it,
  # so drop the "no patches" placeholder line before appending the block.
  $lines = @(Get-Content $patchFile)
  $dropped = $false
  for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i].Trim() -eq '[]') {
      $lines[$i] = ''
      $dropped = $true
    }
  }
  if ($dropped) {
    [System.IO.File]::WriteAllLines($patchFile, $lines, (New-Object System.Text.UTF8Encoding($false)))
  }
  $lineCountBefore = @(Get-Content $patchFile).Count
  Add-Content -Path $patchFile -Value $block -Encoding UTF8
  Write-Host "[2/3] Appended the plugin row to $patchFile"
  if (-not (Test-PatchYaml -Path $patchFile -RowId 'ui-notify')) {
    # Validation failed: roll back exactly the lines we appended.
    $all = @(Get-Content $patchFile)
    if ($all.Count -gt $lineCountBefore) {
      $all[0..($lineCountBefore - 1)] | Set-Content -Path $patchFile -Encoding UTF8
    }
    Write-Host '[2/3] ERROR: YAML validation of cordis.patch.yml failed; the appended block was rolled back.' -ForegroundColor Red
    Write-Host '       Fix the file (or the plugin row) and re-run this script.' -ForegroundColor Red
    Read-Host 'Press Enter to exit'
    exit 1
  }
  Write-Host '[2/3] YAML validation of cordis.patch.yml passed.'
}

# 3) Done: keep the window open so the restart reminder stays visible.
Write-Host ''
Write-Host '============================================================'
Write-Host ' Installation complete.'
Write-Host ' Please restart the dsh web server, then refresh the browser'
Write-Host ' and open Settings > General to configure the notifications.'
Write-Host '============================================================'
Read-Host 'Press Enter to exit'
