; ═══════════════════════════════════════════════════════════════
; Advanced Typing Instructor — Complete Inno Setup Script
; Version: 3.2.1
; ═══════════════════════════════════════════════════════════════

#define AppName "Advanced Typing Instructor"
#define AppVersion "3.2.2"
#define AppPublisher "Class Of Learners"
#define AppURL "https://advancedlogiclabs.dpdns.org/ati"
#define AppExe "AdvancedTypingInstructor.exe"
#define AppId "{{8B44A759-99E6-4A59-B81E-4E65F767F2C5}}"

[Setup]
AppId={#AppId}
AppName={#AppName}
AppVersion={#AppVersion}
AppVerName={#AppName} {#AppVersion}
AppPublisher={#AppPublisher}
AppPublisherURL={#AppURL}
AppSupportURL={#AppURL}
AppUpdatesURL=https://advancedlogiclabs.dpdns.org/ati-version.json

; Branding, Icons and Visual Artwork
SetupIconFile=game_icon.ico
WizardImageFile=WizardImage.bmp
WizardSmallImageFile=WizardSmall.bmp
LicenseFile=ADVANCED TYPING INSTRUCTOR - LICENSE.txt

; Target Paths
DefaultDirName={autopf}\Advanced Typing Instructor
DefaultGroupName={#AppName}
UsePreviousAppDir=yes
DirExistsWarning=no
UninstallDisplayIcon={app}\game_icon.ico
UninstallDisplayName={#AppName}

; 64-bit Architecture
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible

; Per-User Install (No UAC administrator prompt required)
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog

; Output Configuration
OutputDir=.\Output
OutputBaseFilename=AdvancedTypingInstructor_Setup
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
MinVersion=10.0
SetupLogging=yes

; Process Management
CloseApplications=force
RestartApplications=no

VersionInfoVersion=3.2.2.0
VersionInfoCompany={#AppPublisher}
VersionInfoDescription={#AppName} Setup
VersionInfoCopyright=2026 Neel, Ansh and Aarush

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"
Name: "autostart"; Description: "Launch On Windows startup (Minimized To System Tray)"; GroupDescription: "System Integration:"; Flags: unchecked

[Files]
; Unconditional file extraction into {app}
Source: "{#AppExe}"; DestDir: "{app}"; Flags: ignoreversion restartreplace
Source: "game_icon.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "ADVANCED TYPING INSTRUCTOR - LICENSE.txt"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\{#AppName}"; Filename: "{app}\{#AppExe}"; IconFilename: "{app}\game_icon.ico"; Comment: "{#AppName} — Offline Desktop Typing Tutor & Esports Arena"
Name: "{group}\{cm:UninstallProgram,{#AppName}}"; Filename: "{uninstallexe}"; IconFilename: "{app}\game_icon.ico"
Name: "{autodesktop}\{#AppName}"; Filename: "{app}\{#AppExe}"; IconFilename: "{app}\game_icon.ico"; Comment: "{#AppName}"; Tasks: desktopicon

[Registry]
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "AdvancedTypingInstructor"; ValueData: """{app}\{#AppExe}"" --tray"; Flags: uninsdeletevalue; Tasks: autostart

[Run]
; Launch option with checkbox on the completion screen
Filename: "{app}\{#AppExe}"; Description: "{cm:LaunchProgram,{#AppName}}"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
Type: filesandordirs; Name: "{app}\EBWebView"
Type: filesandordirs; Name: "{app}\updates"
Type: dirifempty; Name: "{app}"

[Code]
// Terminate any running or background tray instance before installation so files are never locked
function PrepareToInstall(var NeedsRestart: Boolean): String;
var
  ResultCode: Integer;
begin
  Exec('taskkill.exe', '/F /IM AdvancedTypingInstructor.exe', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Sleep(250);
  Result := '';
end;
