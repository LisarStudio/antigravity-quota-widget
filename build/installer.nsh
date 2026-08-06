; NSIS Custom Installer Script
; Antigravity AI Monitor — Lisar Studio
!macro preInit
  ; Dejar que NSIS use el directorio de instalación predeterminado del usuario o la selección personalizada
!macroend

!macro customInstall
  ; Abrir el widget al finalizar la instalación
  ExecShell "open" "$INSTDIR\Antigravity AI Monitor.exe"
!macroend
