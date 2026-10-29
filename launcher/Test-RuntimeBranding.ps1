# Real PE resources and hidden runtime test. Never touches the live app or its data.
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$fixture = Join-Path $projectRoot ('research\runtime identity ' + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $fixture -Force | Out-Null
Add-Type -Path (Join-Path $PSScriptRoot 'RuntimeBranding.cs')
$original = Join-Path $projectRoot 'vendor\siwc\node_modules\electron\dist\electron.exe'
$icon = Join-Path $projectRoot 'app\assets\clo-ai.ico'
$entry = Join-Path $projectRoot 'app\runtime-branding-smoke.cjs'
$before = (Get-FileHash -LiteralPath $original -Algorithm SHA256).Hash
$defaultApp=Join-Path (Split-Path -Parent $original) 'resources\default_app.asar'
$defaultAppHash=(Get-FileHash -LiteralPath $defaultApp -Algorithm SHA256).Hash
$branded = [CloRuntimeBranding]::Prepare($original,$icon,$entry)
$firstWrite = (Get-Item -LiteralPath $branded).LastWriteTimeUtc
if ([CloRuntimeBranding]::Prepare($original,$icon,$entry) -ne $branded -or (Get-Item -LiteralPath $branded).LastWriteTimeUtc -ne $firstWrite) { throw 'Повторный запуск переписывает файл runtime.' }
if ((Get-FileHash -LiteralPath $original -Algorithm SHA256).Hash -ne $before) { throw 'Исходный Electron изменён.' }
if ((Get-FileHash -LiteralPath $defaultApp -Algorithm SHA256).Hash -ne $defaultAppHash) { throw 'Ресурсы исходного Electron изменены.' }
$metadata = [Diagnostics.FileVersionInfo]::GetVersionInfo($branded)
if ($metadata.FileDescription -ne 'CLO AI' -or $metadata.ProductName -ne 'CLO AI' -or $metadata.OriginalFilename -ne 'CLO AI.exe') { throw 'Windows не видит нативное имя CLO AI.' }
function Section-Hashes([string]$file) {
 $bytes = [IO.File]::ReadAllBytes($file)
 $pe = [BitConverter]::ToInt32($bytes,0x3c)
 $count = [BitConverter]::ToUInt16($bytes,$pe+6)
 $table = $pe+24+[BitConverter]::ToUInt16($bytes,$pe+20)
 $result = @{}
 $sha = [Security.Cryptography.SHA256]::Create()
 try {
  for ($index=0; $index -lt $count; $index++) {
   $offset=$table+40*$index
   $name=[Text.Encoding]::ASCII.GetString($bytes,$offset,8).TrimEnd([char]0)
   if ($name -eq '.rsrc') { continue }
   $size=[BitConverter]::ToInt32($bytes,$offset+16); $start=[BitConverter]::ToInt32($bytes,$offset+20)
   $result[$name]=[BitConverter]::ToString($sha.ComputeHash($bytes,$start,$size))
  }
 } finally { $sha.Dispose() }
 return $result
}
$originalSections=Section-Hashes $original; $brandedSections=Section-Hashes $branded
foreach ($section in $originalSections.Keys) { if ($brandedSections[$section] -ne $originalSections[$section]) { throw ('Код runtime изменён: '+$section) } }
$entry = Join-Path $projectRoot 'app\runtime-branding-smoke.cjs'
foreach ($mode in @('original','branded')) {
 $runtime = if ($mode -eq 'original') { $original } else { $branded }
 $process = Start-Process -FilePath $runtime -ArgumentList ('"' + $entry + '" "' + $fixture + '" ' + $mode) -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru
 try {
  if (-not $process.WaitForExit(20000)) { $process.Kill(); throw ('Runtime не завершил проверку: '+$mode) }
  $errorFile=Join-Path $fixture ($mode+'-error.txt')
  if (Test-Path -LiteralPath $errorFile) { throw [IO.File]::ReadAllText($errorFile) }
  if ($process.ExitCode -ne 0 -or -not (Test-Path -LiteralPath (Join-Path $fixture ($mode+'.json')))) { throw ('Runtime не запустил проверку: '+$mode) }
 } finally { $process.Dispose() }
}
$old=Get-Content -LiteralPath (Join-Path $fixture 'original.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$new=Get-Content -LiteralPath (Join-Path $fixture 'branded.json') -Raw -Encoding UTF8 | ConvertFrom-Json
if ($old.electron -ne $new.electron -or $old.node -ne $new.node -or $old.user_data -ne $new.user_data -or $old.default_user_data -ne $new.default_user_data -or $new.app_name -ne 'CLO AI' -or -not $new.credential_roundtrip) { throw 'Изменились runtime, каталог данных или шифрование.' }
if ($old.is_packaged -or -not $new.is_packaged) { throw 'Не подтверждён автономный пакет приложения.' }
if ($old.shell_icon_sha256 -eq $new.shell_icon_sha256) { throw 'Windows всё ещё извлекает иконку Electron.' }
if ($new.shell_icon_sha256 -ne $new.expected_icon_sha256) { throw 'Иконка runtime отличается от иконки CLO AI.exe.' }
$report=[ordered]@{passed=$true; runtime=$branded; file_description=$metadata.FileDescription; product_name=$metadata.ProductName; native_shell_icon_changed=$true; source_unchanged=$true; source_resources_unchanged=$true; code_sections_unchanged=$true; preparation_idempotent=$true; electron=$new.electron; credential_compatible=$true; same_user_data=$true; packaged_application=$true; hidden=$true; computer_use=$false; real_user_data_touched=$false}
$report | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $projectRoot 'research\runtime-branding-native.json') -Encoding UTF8
$report | ConvertTo-Json
