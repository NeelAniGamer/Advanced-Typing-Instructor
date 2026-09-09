[Setup]
LicenseFile=ADVANCED TYPING INSTRUCTOR - LICENSE.txt
WizardImageFile=WizardImage.bmp
WizardSmallImageFile=WizardSmall.bmp
; General Application Information
AppName=Advanced Typing Instructor
AppVersion=2.5.0
AppPublisher=Class Of Learners
AppPublisherURL=https://advancedlogiclabs.dpdns.org/ati
AppSupportURL=https://advancedlogiclabs.dpdns.org/
AppUpdatesURL=https://advancedlogiclabs.dpdns.org/ati-version.json

; Where The Game Installs On The User's PC
DefaultDirName={autopf}\Advanced Typing Instructor
DefaultGroupName=Advanced Typing Instructor

; The Output Installer File Details
OutputDir=.\Output
OutputBaseFilename=AdvancedTypingInstructor_Setup
SetupIconFile=game_icon.ico

Compression=lzma2
SolidCompression=yes
WizardStyle=modern

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
; Standalone PyInstaller Executable
Source: "AdvancedTypingInstructor.exe"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
; Creates Start Menu And Desktop Shortcuts with icon
Name: "{group}\Advanced Typing Instructor"; Filename: "{app}\AdvancedTypingInstructor.exe"; IconFilename: "{app}\AdvancedTypingInstructor.exe"
Name: "{autodesktop}\Advanced Typing Instructor"; Filename: "{app}\AdvancedTypingInstructor.exe"; IconFilename: "{app}\AdvancedTypingInstructor.exe"; Tasks: desktopicon

[Run]
; Offers To Launch The Game After Installation
Filename: "{app}\AdvancedTypingInstructor.exe"; Description: "{cm:LaunchProgram,Advanced Typing Instructor}"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
; Deletes The SQLite Database File and cache on clean uninstall
Type: files; Name: "{app}\typing_quest.db"
Type: filesandordirs; Name: "{app}\EBWebView"
Type: filesandordirs; Name: "{app}\updates"
Type: dirifempty; Name: "{app}"
