# Antigravity AI Monitor 🛸

> Widget de escritorio para monitoreo en tiempo real de cuotas y tokens de modelos AI. Compatible con **Antigravity IDE**, **VS Code + GitHub Copilot**, y **Cursor IDE**.

![Electron](https://img.shields.io/badge/Electron-30-47848F?logo=electron&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)

---

## ✨ Características

- 🔄 **Sincronización en tiempo real** con el LanguageServer local (Codeium/Antigravity)
- 🤖 **Detección automática de IDE** — Detecta si usas Antigravity, VS Code, Cursor u otro IDE
- 📊 **Cuotas Gemini y Claude/GPT** — Monitoreo semanal y por ventana de 5 horas
- ⏱️ **Countdown en tiempo real** — Temporizador de recarga con cuenta regresiva
- 🔔 **Notificaciones nativas** — Alertas de cuota baja (< 10%), 30 min antes de recarga, y recarga completa
- 🎨 **Temas de color** — Rojo (JARVIS), Azul (Ciber), Verde (Matrix), Morado (Synth)
- 📌 **Siempre encima** — Se mantiene visible sobre otras ventanas
- 📉 **Sparkline de tendencia** — Gráfico de uso de las últimas 10 lecturas
- 🖥️ **Modo compacto** — Vista reducida tipo pill para no estorbar mientras programas
- 🪟 **Bandeja del sistema** — Se queda en la bandeja de Windows al cerrar

## 🚀 Instalación

### Instalador (Recomendado)
Descarga el instalador desde la sección de [Releases](../../releases):
- `Antigravity AI Monitor Setup 1.0.0.exe`

### Desde el código fuente
```bash
git clone https://github.com/LisarStudio/antigravity-quota-widget.git
cd antigravity-quota-widget
npm install
npm run dev        # Modo desarrollo
npm run build      # Build producción
```

### Generar instalador localmente
```powershell
.\build-installer.ps1
```
El instalador se genera en `release/Antigravity AI Monitor Setup 1.0.0.exe`

## 🔧 IDEs Soportados

| IDE | Estado | Notas |
|-----|--------|-------|
| Antigravity IDE | ✅ Completo | Sincronización nativa de cuotas via LanguageServer |
| VS Code + GitHub Copilot | ✅ Detectado | Detecta procesos de VS Code y Copilot Agent |
| Cursor IDE | ✅ Detectado | Detección automática del proceso |

## 📦 Stack Tecnológico

- **Frontend**: React 18 + TypeScript + Vite 5
- **Desktop**: Electron 30
- **Backend local**: Express.js (servidor de datos integrado)
- **Diseño**: CSS custom con variables temáticas + JetBrains Mono + Inter
- **Empaquetado**: electron-builder (NSIS installer para Windows)

## 📁 Estructura del Proyecto

```
antigravity-quota-widget/
├── main.js                 # Proceso principal Electron
├── preload.js              # Puente seguro IPC
├── server.cjs              # Backend local (API de cuotas)
├── src/
│   ├── App.tsx             # Componente principal
│   ├── index.css           # Design system CSS
│   ├── components/         # UI components
│   ├── providers/          # Data fetching layer
│   ├── services/           # Storage & notifications
│   └── types/              # TypeScript types
├── build/                  # Assets (icono)
├── build-installer.ps1     # Script de empaquetado
└── Lanzar-Widget.bat       # Ejecutar modo desarrollo
```

## 🎨 Capturas

El widget incluye una interfaz estilo cyberpunk/JARVIS con glassmorphism y efectos de neon.

## 📄 Licencia

MIT © [LisarStudio](https://github.com/LisarStudio)
