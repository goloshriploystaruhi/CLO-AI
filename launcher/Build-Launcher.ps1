param([string]$OutputPath)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
if (-not $OutputPath) { $OutputPath = Join-Path $projectRoot 'CLO AI.exe' }
$OutputPath = [IO.Path]::GetFullPath($OutputPath)
if (-not (Test-Path -LiteralPath (Split-Path -Parent $OutputPath) -PathType Container)) {
    throw 'Папка для сборки должна существовать.'
}
$compiler = @(
    (Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'),
    (Join-Path $env:WINDIR 'Microsoft.NET\Framework\v4.0.30319\csc.exe')
) | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } | Select-Object -First 1
if (-not $compiler) { throw 'Не найден компилятор .NET Framework, входящий в установленную Windows.' }
$icon = Join-Path $projectRoot 'app\assets\clo-ai.ico'
if (-not (Test-Path -LiteralPath $icon -PathType Leaf)) { throw 'Не найдена иконка app/assets/clo-ai.ico.' }
& $compiler /nologo /target:winexe /platform:anycpu /optimize+ /codepage:65001 /r:System.Windows.Forms.dll ("/win32icon:" + $icon) ("/out:" + $OutputPath) (Join-Path $PSScriptRoot 'Launcher.cs') (Join-Path $PSScriptRoot 'RuntimeBranding.cs')
if ($LASTEXITCODE -ne 0) { throw 'Не удалось собрать CLO AI.exe.' }
Get-Item -LiteralPath $OutputPath | Select-Object FullName,Length
