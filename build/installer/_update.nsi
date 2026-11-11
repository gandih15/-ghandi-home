Unicode true
!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "WinVer.nsh"

!define APPNAME "Ghandi Home"
!define APPAR "غاندي للأدوات المنزلية"
!define VERSION "1.7.0"
!define VERTXT "1.7.0"
!define PUBLISHER "Eng. Mohamed Ali - 01098811581"
!define UNKEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\GhandiHome"

Name "تحديث ${APPAR} — الإصدار ${VERTXT}"
OutFile "/home/claude/ghandi-home/dist/Ghandi-Home-Update-1.7.0.exe"
InstallDir "C:\GhandiHome"
RequestExecutionLevel admin
SetCompressor /SOLID lzma
BrandingText "${APPAR} — م. محمد علي 01098811581"
VIProductVersion "${VERSION}.0"
VIAddVersionKey "ProductName" "${APPNAME} Update"
VIAddVersionKey "CompanyName" "${PUBLISHER}"
VIAddVersionKey "FileDescription" "Ghandi Home Update ${VERTXT}"
VIAddVersionKey "FileVersion" "${VERSION}"
VIAddVersionKey "ProductVersion" "${VERSION}"
VIAddVersionKey "LegalCopyright" "${PUBLISHER}"

!define MUI_ICON "/home/claude/ghandi-home/build/ghandi.ico"
!define MUI_ABORTWARNING
!define MUI_WELCOMEPAGE_TITLE "تحديث غاندي للإصدار ${VERTXT}"
!define MUI_WELCOMEPAGE_TEXT "التحديث ده بيحدّث البرنامج المتسطّب عندك من غير ما يمسح أي حاجة.$\r$\n$\r$\n✓ المبيعات والأصناف والعملاء والإعدادات والتفعيل كلهم هيفضلوا زي ما هم.$\r$\n✓ قبل التحديث هتتعمل نسخة من البيانات في فولدر data\pre-update.$\r$\n$\r$\nلو البرنامج مفتوح هيتقفل تلقائي.$\r$\n$\r$\nالدعم: م. محمد علي — 01098811581"
!define MUI_DIRECTORYPAGE_TEXT_TOP "ده مكان غاندي المتسطّب على الجهاز (البرنامج لقاه لوحده). لو متسطّب في مكان تاني اختاره."
!define MUI_DIRECTORYPAGE_TEXT_DESTINATION "فولدر غاندي الحالي"
!define MUI_PAGE_CUSTOMFUNCTION_LEAVE CheckDir
!define MUI_FINISHPAGE_RUN "$INSTDIR\GhandiHome.exe"
!define MUI_FINISHPAGE_RUN_TEXT "شغّل غاندي دلوقتي"
!define MUI_FINISHPAGE_TITLE "تم التحديث بنجاح ✓"
!define MUI_FINISHPAGE_TEXT "غاندي اتحدّث للإصدار ${VERTXT}، وكل بياناتك زي ما هي.$\r$\n$\r$\nأول ما تفتح البرنامج هيعرضلك الجديد في الإصدار ده."

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
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
  ${If} ${FileExists} "D:\GhandiHome\GhandiHome.exe"
    StrCpy $INSTDIR "D:\GhandiHome"
  ${ElseIf} ${FileExists} "E:\GhandiHome\GhandiHome.exe"
    StrCpy $INSTDIR "E:\GhandiHome"
  ${EndIf}
FunctionEnd

Function CheckDir
  ${IfNot} ${FileExists} "$INSTDIR\GhandiHome.exe"
    MessageBox MB_ICONEXCLAMATION "مش لاقي غاندي في الفولدر ده:$\r$\n$INSTDIR$\r$\n$\r$\nاختار الفولدر اللي فيه GhandiHome.exe.$\r$\nلو البرنامج مش متسطّب أصلاً استخدم ملف التسطيب الكامل Ghandi-Setup."
    Abort
  ${EndIf}
FunctionEnd

Section "Update"
  SetShellVarContext all
  DetailPrint "قفل البرنامج لو مفتوح..."
  nsExec::Exec 'taskkill /IM GhandiHome.exe'
  Sleep 2500
  nsExec::Exec 'taskkill /F /IM GhandiHome.exe'
  Sleep 800
  DetailPrint "نسخة أمان من البيانات قبل التحديث..."
  CreateDirectory "$INSTDIR\data\pre-update"
  ${If} ${FileExists} "$INSTDIR\data\ghandi.db"
    CopyFiles /SILENT "$INSTDIR\data\ghandi.db" "$INSTDIR\data\pre-update\ghandi.db"
  ${EndIf}
  ${If} ${FileExists} "$INSTDIR\data\license.key"
    CopyFiles /SILENT "$INSTDIR\data\license.key" "$INSTDIR\data\pre-update\license.key"
  ${EndIf}
  DetailPrint "تحديث ملفات البرنامج..."
  SetOutPath "$INSTDIR\resources"
  Delete "$INSTDIR\resources\app.asar.old"
  Rename "$INSTDIR\resources\app.asar" "$INSTDIR\resources\app.asar.old"
  ClearErrors
  File "/home/claude/ghandi-home/dist/GhandiHome/resources/app.asar"
  ${If} ${Errors}
    Rename "$INSTDIR\resources\app.asar.old" "$INSTDIR\resources\app.asar"
    MessageBox MB_ICONSTOP "حصلت مشكلة أثناء نسخ الملفات — البرنامج رجع زي ما كان. قفل البرنامج وجرّب تاني."
    Abort
  ${EndIf}
  Delete "$INSTDIR\resources\app.asar.old"
  nsExec::Exec 'icacls "$INSTDIR\data" /grant *S-1-5-32-545:(OI)(CI)M /T /Q'
  WriteRegStr HKLM "${UNKEY}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKLM "${UNKEY}" "InstallLocation" "$INSTDIR"
  DetailPrint "تم ✓"
SectionEnd
