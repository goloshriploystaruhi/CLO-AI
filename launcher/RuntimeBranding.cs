using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text;
using System.Threading;

// Package the existing Electron runtime without changing its code or shared DLLs.
// Explorer can fall back to the process executable's resources despite window properties.
public static class CloRuntimeBranding
{
    const string Revision = "clo-ai-packaged-runtime-v2";
    const ushort IconBase = 59000;
    sealed class Resource
    {
        internal int Id;
        internal string Name;
        internal ushort Language;
    }
    delegate bool EnumName(IntPtr module, IntPtr type, IntPtr name, IntPtr parameter);
    delegate bool EnumLanguage(IntPtr module, IntPtr type, IntPtr name, ushort language, IntPtr parameter);
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    static extern IntPtr LoadLibraryEx(string file, IntPtr reserved, uint flags);
    [DllImport("kernel32.dll", SetLastError = true)] static extern bool FreeLibrary(IntPtr module);
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    static extern bool EnumResourceNames(IntPtr module, IntPtr type, EnumName callback, IntPtr parameter);
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    static extern bool EnumResourceLanguages(IntPtr module, IntPtr type, IntPtr name, EnumLanguage callback, IntPtr parameter);
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    static extern IntPtr BeginUpdateResource(string file, bool deleteExisting);
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    static extern bool UpdateResource(IntPtr update, IntPtr type, IntPtr name, ushort language, byte[] data, uint size);
    [DllImport("kernel32.dll", SetLastError = true)] static extern bool EndUpdateResource(IntPtr update, bool discard);
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    static extern bool CreateHardLink(string file, string existing, IntPtr reserved);

    public static string Prepare(string source, string icon)
    {
        string root = Directory.GetParent(Path.GetDirectoryName(Path.GetFullPath(icon))).Parent.FullName;
        return Prepare(source, icon, Path.Combine(root, "app", "main.cjs"));
    }
    public static string Prepare(string source, string icon, string entry)
    {
        source = Path.GetFullPath(source); icon = Path.GetFullPath(icon); entry = Path.GetFullPath(entry);
        if (!File.Exists(source) || !File.Exists(icon) || !File.Exists(entry)) throw new FileNotFoundException("Не найдены файлы запуска CLO AI.");
        string originalFolder = Path.GetDirectoryName(source);
        string runtimeRoot = Path.Combine(originalFolder, ".clo-ai");
        string relativeEntry = RelativeFile(Path.Combine(runtimeRoot, "runtime", "resources", "app"), entry);
        // A content-based path also avoids Explorer reusing the old electron.exe icon cache.
        string signature = Hash(Encoding.UTF8.GetBytes(Revision + ":" + HashFile(source) + ":" + HashFile(icon) + ":" + relativeEntry)).Substring(0, 20);
        string destination = Path.Combine(runtimeRoot, signature);
        string target = Path.Combine(destination, "CLO AI.exe");
        if (ValidRuntime(destination, relativeEntry)) return target;
        using (var gate = new Mutex(false, "Local\\CLOAI.RuntimeBranding." + signature))
        {
            bool entered = false;
            try
            {
                try { entered = gate.WaitOne(20000); } catch (AbandonedMutexException) { entered = true; }
                if (!entered) throw new IOException("Не удалось подготовить запуск CLO AI. Повторите попытку.");
                if (ValidRuntime(destination, relativeEntry)) return target;
                Directory.CreateDirectory(runtimeRoot);
                string temporary = Path.Combine(runtimeRoot, ".preparing-" + Guid.NewGuid().ToString("N"));
                try
                {
                    Directory.CreateDirectory(temporary);
                    CopyRuntimeFiles(originalFolder, temporary, source);
                    string executable = Path.Combine(temporary, "CLO AI.exe");
                    File.Copy(source, executable, false);
                    Brand(executable, source, icon);
                    WriteBootstrap(temporary, relativeEntry);
                    if (!ValidRuntime(temporary, relativeEntry)) throw new IOException("Не удалось проверить имя и значок CLO AI.");
                    if (Directory.Exists(destination)) throw new IOException("Файлы запуска CLO AI повреждены. Закройте плагин и повторите подготовку папки " + signature + ".");
                    Directory.Move(temporary, destination);
                    return target;
                }
                finally
                {
                    // Only the absolute, owned preparation folder may be removed.
                    string resolved = Path.GetFullPath(temporary);
                    if (resolved.StartsWith(Path.GetFullPath(runtimeRoot) + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase) && Path.GetFileName(resolved).StartsWith(".preparing-", StringComparison.Ordinal) && Directory.Exists(resolved)) Directory.Delete(resolved, true);
                }
            }
            finally { if (entered) gate.ReleaseMutex(); }
        }
    }
    static string RelativeFile(string directory, string file)
    {
        var root = new Uri(Path.GetFullPath(directory).TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar);
        var relative = root.MakeRelativeUri(new Uri(Path.GetFullPath(file)));
        return relative.IsAbsoluteUri ? Path.GetFullPath(file) : Uri.UnescapeDataString(relative.ToString());
    }
    static string Json(string value)
    {
        var text = new StringBuilder("\"");
        foreach (char item in value)
        {
            if (item == '\\' || item == '"') text.Append('\\').Append(item);
            else if (item < 32) text.Append("\\u").Append(((int)item).ToString("x4"));
            else text.Append(item);
        }
        return text.Append('"').ToString();
    }
    static string Bootstrap(string relativeEntry)
    {
        return "'use strict';\nconst path=require('node:path');\nconst entry=path.resolve(__dirname," + Json(relativeEntry) + ");\n" +
            "process.chdir(path.dirname(path.dirname(entry)));\nif(process.argv[1]!==entry)process.argv.splice(1,0,entry);\nrequire(entry);\n";
    }
    static void WriteBootstrap(string folder, string relativeEntry)
    {
        string app = Path.Combine(folder, "resources", "app"); Directory.CreateDirectory(app);
        var encoding = new UTF8Encoding(false);
        File.WriteAllText(Path.Combine(app, "package.json"), "{\"name\":\"clo-ai\",\"productName\":\"CLO AI\",\"version\":\"1.0.0\",\"main\":\"bootstrap.cjs\"}\n", encoding);
        File.WriteAllText(Path.Combine(app, "bootstrap.cjs"), Bootstrap(relativeEntry), encoding);
    }
    static bool ValidRuntime(string folder, string relativeEntry)
    {
        string bootstrap = Path.Combine(folder, "resources", "app", "bootstrap.cjs");
        return Valid(Path.Combine(folder, "CLO AI.exe")) && File.Exists(bootstrap) && File.ReadAllText(bootstrap) == Bootstrap(relativeEntry) && File.Exists(Path.Combine(folder, "resources", "app", "package.json"));
    }
    static void LinkOrCopy(string source, string destination)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(destination));
        if (!CreateHardLink(destination, source, IntPtr.Zero)) File.Copy(source, destination, false);
    }
    static void CopyTree(string source, string destination, bool resources)
    {
        Directory.CreateDirectory(destination);
        foreach (string file in Directory.GetFiles(source))
        {
            string name = Path.GetFileName(file);
            if (resources && (name.Equals("app.asar", StringComparison.OrdinalIgnoreCase) || name.Equals("default_app.asar", StringComparison.OrdinalIgnoreCase))) continue;
            LinkOrCopy(file, Path.Combine(destination, name));
        }
        foreach (string directory in Directory.GetDirectories(source))
        {
            string name = Path.GetFileName(directory);
            if (resources && name.Equals("app", StringComparison.OrdinalIgnoreCase)) continue;
            CopyTree(directory, Path.Combine(destination, name), false);
        }
    }
    static void CopyRuntimeFiles(string sourceFolder, string destination, string executable)
    {
        foreach (string file in Directory.GetFiles(sourceFolder))
        {
            string name = Path.GetFileName(file);
            if (file.Equals(executable, StringComparison.OrdinalIgnoreCase) || name.StartsWith("CLO AI-", StringComparison.OrdinalIgnoreCase) || name.EndsWith(".log", StringComparison.OrdinalIgnoreCase)) continue;
            LinkOrCopy(file, Path.Combine(destination, name));
        }
        foreach (string directory in Directory.GetDirectories(sourceFolder))
        {
            string name = Path.GetFileName(directory);
            if (name.Equals(".clo-ai", StringComparison.OrdinalIgnoreCase)) continue;
            CopyTree(directory, Path.Combine(destination, name), name.Equals("resources", StringComparison.OrdinalIgnoreCase));
        }
    }
    static bool Valid(string file)
    {
        if (!File.Exists(file)) return false;
        var version = FileVersionInfo.GetVersionInfo(file);
        return version.FileDescription == "CLO AI" && version.ProductName == "CLO AI" && version.InternalName == Revision;
    }
    static string HashFile(string file) { using (var stream = File.OpenRead(file)) using (var hash = SHA256.Create()) return BitConverter.ToString(hash.ComputeHash(stream)).Replace("-", "").ToLowerInvariant(); }
    static string Hash(byte[] bytes) { using (var hash = SHA256.Create()) return BitConverter.ToString(hash.ComputeHash(bytes)).Replace("-", "").ToLowerInvariant(); }
    static List<Resource> Resources(string file, int type)
    {
        var resources = new List<Resource>();
        IntPtr module = LoadLibraryEx(file, IntPtr.Zero, 0x22);
        if (module == IntPtr.Zero) throw new Win32Exception(Marshal.GetLastWin32Error());
        try
        {
            EnumName names = delegate(IntPtr library, IntPtr kind, IntPtr name, IntPtr parameter)
            {
                long raw = name.ToInt64(); bool numeric = (raw & ~0xffffL) == 0;
                EnumLanguage languages = delegate(IntPtr ignored, IntPtr resourceType, IntPtr resourceName, ushort language, IntPtr value)
                {
                    resources.Add(new Resource { Id = numeric ? (int)raw : 0, Name = numeric ? null : Marshal.PtrToStringUni(name), Language = language }); return true;
                };
                if (!EnumResourceLanguages(library, kind, name, languages, IntPtr.Zero)) throw new Win32Exception(Marshal.GetLastWin32Error());
                return true;
            };
            if (!EnumResourceNames(module, new IntPtr(type), names, IntPtr.Zero))
            {
                int error = Marshal.GetLastWin32Error();
                if (error != 1813 && error != 1812) throw new Win32Exception(error);
            }
        }
        finally { FreeLibrary(module); }
        return resources;
    }
    static void Put(IntPtr update, int type, Resource resource, byte[] bytes)
    {
        IntPtr name = resource.Name == null ? new IntPtr(resource.Id) : Marshal.StringToHGlobalUni(resource.Name);
        try { if (!UpdateResource(update, new IntPtr(type), name, resource.Language, bytes, (uint)bytes.Length)) throw new Win32Exception(Marshal.GetLastWin32Error()); }
        finally { if (resource.Name != null) Marshal.FreeHGlobal(name); }
    }
    static void Brand(string target, string source, string icon)
    {
        var versions = Resources(source, 16); if (versions.Count == 0) versions.Add(new Resource { Id = 1, Language = 1033 });
        var groups = Resources(source, 14); if (groups.Count == 0) groups.Add(new Resource { Id = 1, Language = 1033 });
        var existingIcons = Resources(source, 3);
        var ico = File.ReadAllBytes(icon);
        if (ico.Length < 6 || BitConverter.ToUInt16(ico, 0) != 0 || BitConverter.ToUInt16(ico, 2) != 1) throw new IOException("Некорректная иконка CLO AI.");
        int count = BitConverter.ToUInt16(ico, 4);
        if (count < 1 || count > 64 || ico.Length < 6 + 16 * count) throw new IOException("Некорректный каталог иконки CLO AI.");
        foreach (var old in existingIcons) if (old.Name == null && old.Id >= IconBase && old.Id < IconBase + count) throw new IOException("Невозможно безопасно заменить значок приложения.");
        byte[] group;
        using (var stream = new MemoryStream()) using (var writer = new BinaryWriter(stream))
        {
            writer.Write((ushort)0); writer.Write((ushort)1); writer.Write((ushort)count);
            for (int index = 0; index < count; index++) { writer.Write(ico, 6 + 16 * index, 12); writer.Write((ushort)(IconBase + index)); }
            group = stream.ToArray();
        }
        IntPtr update = BeginUpdateResource(target, false);
        if (update == IntPtr.Zero) throw new Win32Exception(Marshal.GetLastWin32Error());
        bool finished = false;
        try
        {
            var version = VersionResource(FileVersionInfo.GetVersionInfo(source));
            foreach (var resource in versions) Put(update, 16, resource, version);
            var languages = new HashSet<ushort>(); foreach (var resource in groups) languages.Add(resource.Language);
            foreach (ushort language in languages) for (int index = 0; index < count; index++)
            {
                int record = 6 + 16 * index; uint size = BitConverter.ToUInt32(ico, record + 8), offset = BitConverter.ToUInt32(ico, record + 12);
                if (size == 0 || (long)offset + size > ico.Length) throw new IOException("Повреждена иконка CLO AI.");
                var bytes = new byte[size]; Buffer.BlockCopy(ico, (int)offset, bytes, 0, (int)size);
                Put(update, 3, new Resource { Id = IconBase + index, Language = language }, bytes);
            }
            foreach (var resource in groups) Put(update, 14, resource, group);
            if (!EndUpdateResource(update, false)) throw new Win32Exception(Marshal.GetLastWin32Error());
            finished = true;
        }
        finally { if (!finished) EndUpdateResource(update, true); }
    }
    static void Align(BinaryWriter writer) { while ((writer.BaseStream.Position & 3) != 0) writer.Write((byte)0); }
    static byte[] Block(string key, ushort type, byte[] value, ushort valueLength, params byte[][] children)
    {
        using (var stream = new MemoryStream()) using (var writer = new BinaryWriter(stream, Encoding.Unicode))
        {
            writer.Write((ushort)0); writer.Write(valueLength); writer.Write(type); writer.Write(Encoding.Unicode.GetBytes(key + "\0")); Align(writer);
            writer.Write(value); foreach (var child in children) { Align(writer); writer.Write(child); }
            if (stream.Length > ushort.MaxValue) throw new IOException("Слишком большой ресурс запуска CLO AI.");
            stream.Position = 0; writer.Write((ushort)stream.Length); return stream.ToArray();
        }
    }
    static byte[] Text(string name, string value) { var bytes = Encoding.Unicode.GetBytes(value + "\0"); return Block(name, 1, bytes, (ushort)(bytes.Length / 2)); }
    static byte[] VersionResource(FileVersionInfo original)
    {
        var strings = Block("040904B0", 1, new byte[0], 0,
            Text("CompanyName", "CLO AI"), Text("FileDescription", "CLO AI"), Text("ProductName", "CLO AI"),
            Text("InternalName", Revision), Text("OriginalFilename", "CLO AI.exe"),
            Text("FileVersion", original.FileVersion ?? "1.0.0.0"), Text("ProductVersion", original.ProductVersion ?? "1.0.0.0"),
            Text("LegalCopyright", original.LegalCopyright ?? ""));
        byte[] fixedInfo;
        using (var stream = new MemoryStream()) using (var writer = new BinaryWriter(stream))
        {
            writer.Write(0xFEEF04BDu); writer.Write(0x00010000u);
            writer.Write(((uint)original.FileMajorPart << 16) | (ushort)original.FileMinorPart); writer.Write(((uint)original.FileBuildPart << 16) | (ushort)original.FilePrivatePart);
            writer.Write(((uint)original.ProductMajorPart << 16) | (ushort)original.ProductMinorPart); writer.Write(((uint)original.ProductBuildPart << 16) | (ushort)original.ProductPrivatePart);
            writer.Write(0x3Fu); writer.Write(0u); writer.Write(0x40004u); writer.Write(1u); writer.Write(0u); writer.Write(0u); writer.Write(0u); fixedInfo = stream.ToArray();
        }
        return Block("VS_VERSION_INFO", 0, fixedInfo, 52,
            Block("StringFileInfo", 1, new byte[0], 0, strings),
            Block("VarFileInfo", 1, new byte[0], 0, Block("Translation", 0, new byte[] { 0x09, 0x04, 0xB0, 0x04 }, 4)));
    }
}
