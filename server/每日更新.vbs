Set fso = CreateObject("Scripting.FileSystemObject")
Set sh = CreateObject("WScript.Shell")
base = fso.GetParentFolderName(WScript.ScriptFullName)
cmd = Chr(34) & "C:\Program Files\nodejs\node.exe" & Chr(34) & " " & Chr(34) & base & "\daily-update.js" & Chr(34)
sh.Run cmd, 0, False
