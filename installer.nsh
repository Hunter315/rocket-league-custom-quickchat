!macro customHeader
  SetOverwrite ifnewer
  SetOverwrite on
!macroend

!macro customInstall
  SetOutPath "$INSTDIR"
  ; Add your custom installation logic here
!macroend

!macro customUnInstall
  ; Add your custom uninstallation logic here
!macroend

Section "Install"
  !insertmacro customHeader
  !insertmacro customInstall
  WriteUninstaller "$INSTDIR\uninstall.exe"
SectionEnd

Section "Uninstall"
  !insertmacro customUnInstall
SectionEnd
