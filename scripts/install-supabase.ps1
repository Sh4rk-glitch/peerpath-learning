param(
  [string]$ArchivePath = "$PSScriptRoot\supabase_windows_amd64.tar.gz"
)

function Write-Info($m) { Write-Host "[INFO] $m" -ForegroundColor Cyan }
function Write-ErrorAndExit($m) { Write-Host "[ERROR] $m" -ForegroundColor Red; exit 1 }

Write-Info "Supabase installer script starting"

if (-not (Test-Path -Path $ArchivePath)) {
  Write-Host "Archive not found at: $ArchivePath"
  Write-Host "Place the downloaded file at that path or pass its path as -ArchivePath"
  exit 1
}

$toolsDir = Join-Path $env:USERPROFILE 'tools'
New-Item -ItemType Directory -Path $toolsDir -Force | Out-Null

$tmp = Join-Path $env:TEMP ("supabase_install_" + [guid]::NewGuid().ToString())
New-Item -ItemType Directory -Path $tmp -Force | Out-Null

Write-Info "Extracting archive to temp folder: $tmp"
try {
  # Use tar (Windows 10+ includes tar). Works with .tar.gz
  & tar -xzf $ArchivePath -C $tmp 2>$null
} catch {
  Write-Info "tar extraction failed, trying built-in Expand-Archive (zip) fallback"
  try {
    Expand-Archive -LiteralPath $ArchivePath -DestinationPath $tmp -Force
  } catch {
    Write-ErrorAndExit "Could not extract archive. Ensure you downloaded the Windows tar.gz release and have 'tar' available in PATH."
  }
}

Write-Info "Searching for supabase executable in extracted files"
$exe = Get-ChildItem -Path $tmp -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.Name -match '^supabase(\.exe)?$' } | Select-Object -First 1
if (-not $exe) {
  # also look for windows-named binary patterns
  $exe = Get-ChildItem -Path $tmp -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.Name -like '*supabase*' -and $_.Extension -match '\.exe' } | Select-Object -First 1
}

if (-not $exe) {
  Write-ErrorAndExit "Could not find supabase executable in archive. Inspect $tmp to find the extracted files."
}

$dest = Join-Path $toolsDir 'supabase.exe'
Copy-Item -Path $exe.FullName -Destination $dest -Force
Write-Info "Copied supabase exe to: $dest"

# Ensure the tools folder is in the user's PATH
$currentPath = [Environment]::GetEnvironmentVariable('Path', 'User')
if ($currentPath -notlike "*$toolsDir*") {
  $newPath = $currentPath + ';' + $toolsDir
  [Environment]::SetEnvironmentVariable('Path', $newPath, 'User')
  Write-Info "Added $toolsDir to user PATH (will apply to new shells)."
} else {
  Write-Info "$toolsDir already in user PATH"
}

Write-Info "Cleaning up temp files"
Remove-Item -Path $tmp -Recurse -Force -ErrorAction SilentlyContinue

Write-Info "Installation complete. To use the supabase CLI now, either open a new PowerShell session or run:`n  $env:Path += ';$toolsDir'` in this session."
Write-Host "Verify by running: supabase --version" -ForegroundColor Green
