# Real packaged runtime, launched with zero arguments. Own hidden probe only.
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$fixture = Join-Path $projectRoot ('research\автономный запуск & пробелы ' + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path (Join-Path $fixture 'app') -Force | Out-Null
$entry = Join-Path $fixture 'app\main.cjs'
@'
const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const folder=path.resolve(__dirname,'..');app.setName('CLO AI');const defaultData=app.getPath('userData');app.setPath('userData',path.join(folder,'isolated-data'));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,title:'CLO AI'});await win.loadURL('data:text/html,<title>CLO AI standalone test</title>');
 fs.writeFileSync(path.join(folder,'probe.json'),JSON.stringify({packaged:app.isPackaged,name:app.getName(),argv:process.argv,entry:__filename,cwd:process.cwd(),default_user_data:defaultData,user_data:app.getPath('userData'),windows:BrowserWindow.getAllWindows().length,visible:win.isVisible(),url:win.webContents.getURL()}));app.quit();
}).catch(error=>{fs.writeFileSync(path.join(folder,'error.txt'),error.stack);app.exit(1);});
'@ | Set-Content -LiteralPath $entry -Encoding UTF8
Add-Type -Path (Join-Path $PSScriptRoot 'RuntimeBranding.cs')
$runtime=[CloRuntimeBranding]::Prepare((Join-Path $projectRoot 'vendor\siwc\node_modules\electron\dist\electron.exe'),(Join-Path $projectRoot 'app\assets\clo-ai.ico'),$entry)
$bootstrap=Join-Path (Split-Path -Parent $runtime) 'resources\app\bootstrap.cjs'
if ([IO.File]::ReadAllText($bootstrap).Contains($projectRoot) -or [IO.File]::ReadAllText($bootstrap).Contains($projectRoot.Replace('\','/'))) { throw 'Bootstrap содержит абсолютный путь к проекту.' }
$link=Join-Path $fixture 'CLO AI.lnk'
$shortcut=(New-Object -ComObject WScript.Shell).CreateShortcut($link);$shortcut.TargetPath=$runtime;$shortcut.Arguments='';$shortcut.WorkingDirectory=$env:WINDIR;$shortcut.Description='CLO AI';$shortcut.Save()
foreach ($attempt in @('direct','shortcut')) {
 $probe=Join-Path $fixture 'probe.json'
 if(Test-Path -LiteralPath $probe){Remove-Item -LiteralPath $probe}
 $target=if($attempt -eq 'direct'){$runtime}else{$link}
 $process=Start-Process -FilePath $target -WorkingDirectory $env:WINDIR -WindowStyle Hidden -PassThru
 try {
  if($process -and -not $process.WaitForExit(20000)){$process.Kill();throw 'Автономный запуск не завершил проверку.'}
  $deadline=[DateTime]::UtcNow.AddSeconds(20);while(-not(Test-Path -LiteralPath $probe)){if([DateTime]::UtcNow -gt $deadline){throw 'Запуск без аргументов не открыл точку входа приложения.'};Start-Sleep -Milliseconds 50}
  if($process -and $process.ExitCode -ne 0){throw 'Автономный запуск вернул ошибку.'}
 }finally{if($process){$process.Dispose()}}
 $data=Get-Content -LiteralPath $probe -Raw -Encoding UTF8 | ConvertFrom-Json
 if(-not $data.packaged -or $data.name -ne 'CLO AI' -or $data.entry -ne $entry -or $data.argv.Count -ne 2 -or $data.argv[1] -ne $entry -or $data.cwd -ne $fixture -or $data.visible -or $data.windows -ne 1 -or $data.url -notlike 'data:text/html*'){throw 'Открылось стартовое окно Electron или неверное приложение.'}
 if([IO.Path]::GetFullPath($data.user_data) -ne (Join-Path $fixture 'isolated-data') -or (Split-Path -Leaf $data.default_user_data) -ne 'CLO AI'){throw 'Изменился каталог данных CLO AI.'}
}
$report=[ordered]@{passed=$true;no_argument_launch=$true;windows_shortcut_launch=$true;taskbar_style_relaunch=$true;original_entry=$true;relative_bootstrap=$true;packaged_application=$true;windows=1;hidden=$true;computer_use=$false;real_app_started=$false;real_user_data_touched=$false}
$report | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $projectRoot 'research\standalone-launch-native.json') -Encoding UTF8
$report | ConvertTo-Json
