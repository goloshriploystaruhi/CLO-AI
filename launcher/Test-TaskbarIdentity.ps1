# Hidden, isolated Electron window; native Windows properties, no computer use.
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$fixture = Join-Path $projectRoot ('research\taskbar identity ' + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $fixture -Force | Out-Null
Add-Type -Path (Join-Path $PSScriptRoot 'RuntimeBranding.cs')
$entry = Join-Path $projectRoot 'app\taskbar-identity-smoke.cjs'
$electron = [CloRuntimeBranding]::Prepare((Join-Path $projectRoot 'vendor\siwc\node_modules\electron\dist\electron.exe'),(Join-Path $projectRoot 'app\assets\clo-ai.ico'),$entry)
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class CloTaskbarPropertyProbe {
 [StructLayout(LayoutKind.Sequential)] struct PropertyKey { public Guid Format; public uint Id; }
 [StructLayout(LayoutKind.Explicit, Size=24)] struct PropVariant {
  [FieldOffset(0)] public ushort Type;
  [FieldOffset(8)] public IntPtr Text;
 }
 [ComImport, Guid("886D8EEB-8CF2-4446-8D02-CDBA1DBDCF99"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
 interface PropertyStore {
  [PreserveSig] int GetCount(out uint count);
  [PreserveSig] int GetAt(uint index, out PropertyKey key);
  [PreserveSig] int GetValue(ref PropertyKey key, out PropVariant value);
  [PreserveSig] int SetValue(ref PropertyKey key, ref PropVariant value);
  [PreserveSig] int Commit();
 }
 [DllImport("shell32.dll")] static extern int SHGetPropertyStoreForWindow(IntPtr hwnd, ref Guid iid, out PropertyStore store);
 [DllImport("ole32.dll")] static extern int PropVariantClear(ref PropVariant value);
 [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hwnd);
 [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hwnd, out uint processId);
 [DllImport("user32.dll", CharSet=CharSet.Auto)] public static extern IntPtr SendMessage(IntPtr hwnd, uint message, IntPtr wParam, IntPtr lParam);
 public static string Read(long handle, uint id) {
  PropertyStore store; Guid iid = typeof(PropertyStore).GUID;
  Marshal.ThrowExceptionForHR(SHGetPropertyStoreForWindow(new IntPtr(handle), ref iid, out store));
  try {
   PropertyKey key = new PropertyKey { Format = new Guid("9F4C2855-9F79-4B39-A8D0-E1D42DE1D5F3"), Id = id };
   PropVariant value; Marshal.ThrowExceptionForHR(store.GetValue(ref key, out value));
   try { if(value.Type==31) return Marshal.PtrToStringUni(value.Text); if(value.Type==8) return Marshal.PtrToStringBSTR(value.Text); return "VT_"+value.Type; }
   finally { PropVariantClear(ref value); }
  } finally { Marshal.FinalReleaseComObject(store); }
 }
}
'@
$probeProcess = Start-Process -FilePath $electron -ArgumentList ('"' + $entry + '" "' + $fixture + '"') -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru
try {
 $ready = Join-Path $fixture 'ready.json'
 $deadline = [DateTime]::UtcNow.AddSeconds(20)
 while (-not (Test-Path -LiteralPath $ready)) {
  if ($probeProcess.HasExited -or [DateTime]::UtcNow -gt $deadline) {
   $errorFile = Join-Path $fixture 'error.txt'
   if (Test-Path -LiteralPath $errorFile) { throw [IO.File]::ReadAllText($errorFile) }
   throw 'Не удалось запустить изолированную проверку Windows.'
  }
  Start-Sleep -Milliseconds 50
 }
 $state = Get-Content -LiteralPath $ready -Raw -Encoding UTF8 | ConvertFrom-Json
 $handleValue = [Int64]::Parse($state.hwnd)
 $handle = [IntPtr]::new($handleValue)
 [uint32]$owner = 0
 [void][CloTaskbarPropertyProbe]::GetWindowThreadProcessId($handle,[ref]$owner)
 if ($owner -ne $state.pid -or $owner -ne $probeProcess.Id) { throw 'Окно не принадлежит проверочному процессу.' }
 if ($state.visible -or [CloTaskbarPropertyProbe]::IsWindowVisible($handle)) { throw 'Проверочное окно оказалось видимым.' }
 $native = [ordered]@{
  app_id = [CloTaskbarPropertyProbe]::Read($handleValue,5)
  relaunch_command = [CloTaskbarPropertyProbe]::Read($handleValue,2)
  relaunch_icon = [CloTaskbarPropertyProbe]::Read($handleValue,3)
  relaunch_name = [CloTaskbarPropertyProbe]::Read($handleValue,4)
 }
 if ($native.app_id -ne 'clo-ai') { throw 'Windows не получил идентификатор CLO AI.' }
 if ($native.relaunch_name -ne 'CLO AI') { throw 'Windows не получил имя CLO AI.' }
 if ($native.relaunch_command -ne ('"' + [IO.Path]::GetFullPath($state.expected_launcher) + '"')) { throw 'Windows использует неверную команду повторного запуска.' }
 if (($native.relaunch_icon -replace ',\s*0$','').Trim('"') -ne [IO.Path]::GetFullPath($state.expected_icon)) { throw 'Windows использует неверную иконку.' }
 $small = [CloTaskbarPropertyProbe]::SendMessage($handle,0x7F,[IntPtr]::Zero,[IntPtr]::Zero)
 $large = [CloTaskbarPropertyProbe]::SendMessage($handle,0x7F,[IntPtr]::new(1),[IntPtr]::Zero)
 if ($small -eq [IntPtr]::Zero -and $large -eq [IntPtr]::Zero) { throw 'Нативное окно не получило иконку.' }
 $report = [ordered]@{ passed=$true; native_properties=$native; native_icon_present=$true; hidden_window=$true; computer_use=$false; real_app_started=$false; user_data_touched=$false }
 $report | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $projectRoot 'research\taskbar-identity-native.json') -Encoding UTF8
 $report | ConvertTo-Json -Depth 4
} finally {
 [IO.File]::WriteAllText((Join-Path $fixture 'done'),'done')
 if (-not $probeProcess.HasExited) { [void]$probeProcess.WaitForExit(3000) }
 if (-not $probeProcess.HasExited) { $probeProcess.Kill() }
 $probeProcess.Dispose()
}
