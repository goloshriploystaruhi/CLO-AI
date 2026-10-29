# Compile a native child probe; never start the real app or touch user profiles.
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$fixture = Join-Path $projectRoot ('research\exe проверка & пробелы ' + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path (Join-Path $fixture 'app'),(Join-Path $fixture 'vendor\siwc\node_modules\electron\dist') -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $fixture 'app\assets') -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $projectRoot 'app\assets\clo-ai.ico') -Destination (Join-Path $fixture 'app\assets\clo-ai.ico')
$testExe = Join-Path $fixture 'CLO AI.exe'
& (Join-Path $PSScriptRoot 'Build-Launcher.ps1') -OutputPath $testExe
[IO.File]::WriteAllText((Join-Path $fixture 'app\main.cjs'), '// Isolated launcher probe')
$probeSource = Join-Path $fixture 'Probe.cs'
@'
using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Diagnostics;
class Probe {
    [DllImport("kernel32.dll")] static extern IntPtr GetConsoleWindow();
    static void Main(string[] args) {
        string root = AppDomain.CurrentDomain.BaseDirectory;
        while (!File.Exists(Path.Combine(root,"app","main.cjs"))) {
            var parent=Directory.GetParent(root.TrimEnd(Path.DirectorySeparatorChar));
            if(parent==null)throw new Exception("Не найдена тестовая папка приложения");
            root=parent.FullName;
        }
        File.WriteAllLines(Path.Combine(root, "probe.txt"), new [] {
            args.Length.ToString(), args.Length > 0 ? args[0] : "", Environment.CurrentDirectory,
            GetConsoleWindow() == IntPtr.Zero ? "no-console" : "console-present",
            Process.GetCurrentProcess().MainModule.FileName,
            FileVersionInfo.GetVersionInfo(Process.GetCurrentProcess().MainModule.FileName).FileDescription
        });
    }
}
'@ | Set-Content -LiteralPath $probeSource -Encoding UTF8
$compiler = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
if (-not (Test-Path -LiteralPath $compiler)) { $compiler = Join-Path $env:WINDIR 'Microsoft.NET\Framework\v4.0.30319\csc.exe' }
& $compiler /nologo /target:exe /codepage:65001 ("/out:" + (Join-Path $fixture 'vendor\siwc\node_modules\electron\dist\electron.exe')) $probeSource
if ($LASTEXITCODE -ne 0) { throw 'Не удалось собрать тестовый процесс.' }
$bytes = [IO.File]::ReadAllBytes($testExe)
$pe = [BitConverter]::ToInt32($bytes,0x3c)
if ([BitConverter]::ToUInt16($bytes,$pe+24+68) -ne 2) { throw 'Запускной файл собран как консольное приложение.' }
$process = Start-Process -FilePath $testExe -WorkingDirectory $env:WINDIR -WindowStyle Hidden -Wait -PassThru
if ($process.ExitCode -ne 0) { throw 'Запускной файл вернул ошибку.' }
$deadline = [DateTime]::UtcNow.AddSeconds(10)
$probe = Join-Path $fixture 'probe.txt'
while (-not (Test-Path -LiteralPath $probe)) {
    if ([DateTime]::UtcNow -gt $deadline) { throw 'Тестовый процесс не запущен.' }
    Start-Sleep -Milliseconds 50
}
$lines = [IO.File]::ReadAllLines($probe)
if ($lines[0] -ne '1' -or $lines[1] -ne (Join-Path $fixture 'app\main.cjs')) { throw 'Путь со спецсимволами или пробелами передан неправильно.' }
if ([IO.Path]::GetFullPath($lines[2]).TrimEnd('\') -ne $fixture.TrimEnd('\')) { throw 'Рабочая папка зависит от места запуска.' }
if ($lines[3] -ne 'no-console') { throw 'Дочерний процесс получил окно консоли.' }
if ([IO.Path]::GetFileName($lines[4]) -ne 'CLO AI.exe' -or $lines[5] -ne 'CLO AI' -or $lines[4] -notlike '*\.clo-ai\*\CLO AI.exe') { throw 'Запускной файл всё ещё запускает небрендированный Electron.' }
$report = [ordered]@{windows_gui_exe=$true; branded_child_runtime=$true; console_absent=$true; unicode_spaces_and_ampersand=$true; independent_working_directory=$true; original_entry_point=$true; real_app_started=$false; user_data_touched=$false}
$report | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $fixture 'result.json') -Encoding UTF8
$report | ConvertTo-Json
