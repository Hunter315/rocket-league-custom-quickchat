; installer.nsh
!macro customHeader
SetOutPath "$TEMP"
FileOpen $0 "$TEMP\install.log" w
FileClose $0
SetDetailPrint textonly
SetDetailOutput $TEMP\install.log
!macroend