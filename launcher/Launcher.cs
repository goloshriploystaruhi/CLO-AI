using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Windows.Forms;

[assembly: AssemblyTitle("CLO AI")]
[assembly: AssemblyProduct("CLO AI")]
[assembly: AssemblyDescription("Запуск CLO AI без командной строки")]
[assembly: AssemblyVersion("1.0.0.0")]
[assembly: AssemblyFileVersion("1.0.0.0")]

internal static class Launcher
{
    [STAThread]
    private static int Main()
    {
        try
        {
            // Resolve from the executable, never from Explorer's working folder.
            string root = AppDomain.CurrentDomain.BaseDirectory;
            string electron = Path.Combine(root, "vendor", "siwc", "node_modules", "electron", "dist", "electron.exe");
            string entry = Path.Combine(root, "app", "main.cjs");
            if (!File.Exists(electron) || !File.Exists(entry))
            {
                throw new FileNotFoundException(
                    "Не найдены файлы CLO AI. Запускай CLO AI.exe из папки проекта, рядом с папками app и vendor. " +
                    "Для запуска с рабочего стола создай ярлык на этот файл.");
            }

            string brandedRuntime = CloRuntimeBranding.Prepare(electron, Path.Combine(root, "app", "assets", "clo-ai.ico"), entry);
            var start = new ProcessStartInfo
            {
                FileName = brandedRuntime,
                // Windows file names cannot contain quotes; entry is a file, not a directory ending in a slash.
                Arguments = "\"" + entry + "\"",
                WorkingDirectory = root,
                UseShellExecute = false,
                CreateNoWindow = true
            };
            // Keep the original entry, runtime version, DLLs, userData name and encryption mechanism.
            using (Process child = Process.Start(start))
            {
                if (child == null) throw new InvalidOperationException("Не удалось запустить интерфейс CLO AI.");
            }
            return 0;
        }
        catch (Exception error)
        {
            MessageBox.Show("Не удалось открыть CLO AI.\n\n" + error.Message,
                "CLO AI", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return 1;
        }
    }
}
