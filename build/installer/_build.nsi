Unicode true
!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "FileFunc.nsh"
!include "WinVer.nsh"

!define APPNAME "Ghandi Home"
!define APPAR "غاندي للأدوات المنزلية"
!define VERSION "1.9.2"
!define PUBLISHER "Eng. Mohamed Ali - 01098811581"
!define UNKEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\GhandiHome"

Name "${APPAR} — ${APPNAME}"
OutFile "/home/claude/ghandi-home/dist/Ghandi-Home-Setup-1.9.2.exe"
InstallDir "C:\GhandiHome"
RequestExecutionLevel admin
SetCompressor /SOLID lzma
SetCompressorDictSize 64
BrandingText "${APPAR} — م. محمد علي 01098811581"
VIProductVersion "${VERSION}.0"
VIAddVersionKey "ProductName" "${APPNAME}"
VIAddVersionKey "CompanyName" "${PUBLISHER}"
VIAddVersionKey "FileDescription" "Ghandi Home Setup"
VIAddVersionKey "FileVersion" "${VERSION}"
VIAddVersionKey "ProductVersion" "${VERSION}"
VIAddVersionKey "LegalCopyright" "${PUBLISHER}"

!define MUI_ICON "/home/claude/ghandi-home/build/ghandi.ico"
!define MUI_UNICON "/home/claude/ghandi-home/build/ghandi.ico"
!define MUI_ABORTWARNING
!define MUI_WELCOMEPAGE_TITLE "أهلاً بيك في تسطيب غاندي"
!define MUI_WELCOMEPAGE_TEXT "نظام إدارة معارض الأدوات المنزلية والأجهزة الكهربائية وتجهيز العرائس والسجاد والستائر.$\r$\n$\r$\nالبرنامج هيتسطّب كنسخة محمولة في فولدر واحد، وهيعمل أيقونة على سطح المكتب.$\r$\n$\r$\nلو عندك نسخة قديمة، بياناتك مش هتتمسح.$\r$\n$\r$\nبرمجة وتطوير: م. محمد علي — 01098811581"
!define MUI_DIRECTORYPAGE_TEXT_TOP "اختار مكان التسطيب. يفضّل بارتيشن غير C (زي D:) علشان لو الويندوز وقع بياناتك تفضل موجودة."
!define MUI_FINISHPAGE_RUN "$INSTDIR\GhandiHome.exe"
!define MUI_FINISHPAGE_RUN_TEXT "شغّل غاندي دلوقتي"
!define MUI_FINISHPAGE_TITLE "تم تسطيب غاندي بنجاح ✓"
!define MUI_FINISHPAGE_TEXT "أول ما البرنامج يفتح هيظهرلك بصمة الجهاز — ابعتها للمطوّر علشان تاخد كود التفعيل.$\r$\n$\r$\nلو عندك نسخة احتياطية على الجهاز أو على فلاشة متوصلة، البرنامج هيلاقيها لوحده.$\r$\n$\r$\nللتفعيل والدعم: 01098811581"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "Arabic"

Function .onInit
  ${IfNot} ${AtLeastWin7}
    MessageBox MB_ICONSTOP "غاندي محتاج ويندوز 7 أو أحدث."
    Abort
  ${EndIf}
  ReadRegStr $0 HKLM "${UNKEY}" "InstallLocation"
  ${If} $0 != ""
  ${AndIf} ${FileExists} "$0\GhandiHome.exe"
    StrCpy $INSTDIR $0
    Return
  ${EndIf}
  ; prefer a non-system partition so data survives a Windows reinstall
  ${If} ${FileExists} "D:\GhandiHome\GhandiHome.exe"
    StrCpy $INSTDIR "D:\GhandiHome"
  ${ElseIf} ${FileExists} "D:\*.*"
    System::Call 'kernel32::GetDriveType(t "D:\") i .r1'
    ${If} $1 == 3
      StrCpy $INSTDIR "D:\GhandiHome"
    ${EndIf}
  ${EndIf}
FunctionEnd

Section "Ghandi" SecMain
  SetShellVarContext all
  nsExec::Exec 'taskkill /F /IM GhandiHome.exe'
  Sleep 800
  ; upgrading an existing install: keep a safety copy of the data first
  ${If} ${FileExists} "$INSTDIR\data\ghandi.db"
    CreateDirectory "$INSTDIR\data\pre-update"
    CopyFiles /SILENT "$INSTDIR\data\ghandi.db" "$INSTDIR\data\pre-update\ghandi.db"
  ${EndIf}
  SetOutPath "$INSTDIR"
  ; program files (data folder is never overwritten)
  RMDir /r "$INSTDIR\resources"
  RMDir /r "$INSTDIR\locales"
  File /r /x data "/home/claude/ghandi-home/dist/GhandiHome\*.*"
  CreateDirectory "$INSTDIR\data"
  CreateDirectory "$INSTDIR\data\backups"
  ; make sure the shop user (not only the admin) can write data & backups
  nsExec::Exec 'icacls "$INSTDIR\data" /grant *S-1-5-32-545:(OI)(CI)M /T /Q'
  nsExec::Exec 'icacls "$INSTDIR\resources" /grant *S-1-5-32-545:(OI)(CI)M /T /Q'
  WriteUninstaller "$INSTDIR\Uninstall-GhandiHome.exe"

  CreateShortCut "$DESKTOP\${APPAR}.lnk" "$INSTDIR\GhandiHome.exe" "" "$INSTDIR\GhandiHome.exe" 0 SW_SHOWMAXIMIZED "" "Ghandi Home"
  CreateDirectory "$SMPROGRAMS\${APPAR}"
  CreateShortCut "$SMPROGRAMS\${APPAR}\${APPAR}.lnk" "$INSTDIR\GhandiHome.exe"
  CreateShortCut "$SMPROGRAMS\${APPAR}\فولدر النسخ الاحتياطية.lnk" "$INSTDIR\data\backups"
  CreateShortCut "$SMPROGRAMS\${APPAR}\إزالة غاندي.lnk" "$INSTDIR\Uninstall-GhandiHome.exe"

  WriteRegStr HKLM "${UNKEY}" "DisplayName" "${APPAR} - ${APPNAME}"
  WriteRegStr HKLM "${UNKEY}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKLM "${UNKEY}" "Publisher" "${PUBLISHER}"
  WriteRegStr HKLM "${UNKEY}" "DisplayIcon" "$INSTDIR\GhandiHome.exe"
  WriteRegStr HKLM "${UNKEY}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKLM "${UNKEY}" "UninstallString" '"$INSTDIR\Uninstall-GhandiHome.exe"'
  WriteRegStr HKLM "${UNKEY}" "HelpTelephone" "01098811581"
  WriteRegDWORD HKLM "${UNKEY}" "NoModify" 1
  WriteRegDWORD HKLM "${UNKEY}" "NoRepair" 1
  ${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2
  WriteRegDWORD HKLM "${UNKEY}" "EstimatedSize" $0
SectionEnd

Section "Uninstall"
  SetShellVarContext all
  nsExec::Exec 'taskkill /F /IM GhandiHome.exe'
  Sleep 800
  Delete "$DESKTOP\${APPAR}.lnk"
  RMDir /r "$SMPROGRAMS\${APPAR}"
  RMDir /r "$INSTDIR\resources"
  RMDir /r "$INSTDIR\locales"
  RMDir /r "$INSTDIR\swiftshader"
  Delete "$INSTDIR\*.exe"
  Delete "$INSTDIR\*.dll"
  Delete "$INSTDIR\*.pak"
  Delete "$INSTDIR\*.bin"
  Delete "$INSTDIR\*.dat"
  Delete "$INSTDIR\*.json"
  Delete "$INSTDIR\*.html"
  Delete "$INSTDIR\*.txt"
  Delete "$INSTDIR\LICENSE*"
  Delete "$INSTDIR\version"
  DeleteRegKey HKLM "${UNKEY}"
  MessageBox MB_YESNO|MB_ICONQUESTION|MB_DEFBUTTON2 "تحب تمسح كمان بيانات المحل (المبيعات والأصناف والنسخ الاحتياطية اللي جوه فولدر البرنامج)؟$\r$\n$\r$\nلو مش متأكد اختار «لا»." IDNO keep
    RMDir /r "$INSTDIR\data"
  keep:
  RMDir "$INSTDIR"
SectionEnd
