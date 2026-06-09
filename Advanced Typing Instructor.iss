[Setup]
LicenseFile=ADVANCED TYPING INSTRUCTOR - LICENSE.txt
WizardImageFile=WizardImage.bmp
WizardSmallImageFile=WizardSmall.bmp
; General Application Information
AppName=Advanced Typing Instructor
AppVersion=1.0.0
AppPublisher=Neel And Ansh

; Where The Game Installs On The User's PC
DefaultDirName={autopf}\Advanced Typing Instructor
DefaultGroupName=Advanced Typing Instructor

; The Output Installer File Details
OutputDir=.\Output
OutputBaseFilename=AdvancedTypingInstructor_Setup

; Optional: If You Have An Icon, Remove The Semicolon On The Next Line And Add Your Icon File Name
; SetupIconFile=myicon.ico

Compression=lzma2
SolidCompression=yes
WizardStyle=modern

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; This Assumes Your main.exe Is In The "dist" Folder Created By PyInstaller
Source: "dist\main.exe"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
; Creates Start Menu And Desktop Shortcuts
Name: "{group}\Advanced Typing Instructor"; Filename: "{app}\main.exe"
Name: "{autodesktop}\Advanced Typing Instructor"; Filename: "{app}\main.exe"; Tasks: desktopicon

[Run]
; Offers To Launch The Game After Installation
Filename: "{app}\main.exe"; Description: "{cm:LaunchProgram,Advanced Typing Instructor}"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
; Deletes The SQLite Database File
Type: files; Name: "{app}\typing_quest.db"

; Deletes The Web Cache Folder Where PyWebView Saves Your 'localStorage' Variables
Type: filesandordirs; Name: "{app}\EBWebView"

; Safely Deletes The Entire Game Folder If It Is Empty After Removing The Above Files
Type: dirifempty; Name: "{app}"

[InstallDelete]
; Deletes The SQLite Database File Before Installing
Type: files; Name: "{app}\typing_quest.db"

; Deletes The Web Cache Folder Before Installing
Type: filesandordirs; Name: "{app}\EBWebView"