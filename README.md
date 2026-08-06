# 💎 ANTIGRAVITY AI MONITOR — Desktop Widget Premium

> **Widget flotante de escritorio de alta gama para monitorización en tiempo real de cuotas, créditos y límites de modelos de IA en Antigravity (Gemini, Claude & GPT). Inspirado en la estética nativa de macOS Sonoma y paneles HUD futuristas tipo JARVIS.**

---

## 🌟 Características Principales

1. **Estética macOS Sonoma + JARVIS HUD**:
   - Material negro-grafito/azulino translúcido con efecto *glassmorphism* real (`backdrop-filter: blur(24px)`).
   - Bordes superfinos con iluminación cian suave (`#00F0FF`) y acentos en azul eléctrico, violeta y verde.
   - Esquinas redondeadas (20px), sombreados suaves y profundidad mediante capas.

2. **Información Muestra en Tiempo Real (Antigravity Settings > Models)**:
   - **Créditos de IA disponibles** en número grande tipo Orbitron.
   - **Estado de "AI Credit Overages"** (Activado vs Inactivo).
   - **Semicírculo de Salud Global** con indicadores *Normal*, *Elevado* o *Crítico*.
   - **Tarjeta Gemini Models**: Cuota semanal restante %, cuota de 5 horas restante %, temporizadores de cuenta regresiva regresivos y gráfica sparkline de tendencia histórica.
   - **Tarjeta Claude & GPT Models**: Cuota semanal restante %, cuota de 5 horas restante %, temporizadores y gráfica sparkline.
   - **Pie del Widget**: Próximo reinicio más cercano, velocidad estimada de consumo (`tok/s`), alertas activas e indicador de sincronización.

3. **Arquitectura Limpia & Capa de Abstracción (`AntigravityQuotaProvider`)**:
   - Capa de abstracción independiente para la obtención de métricas.
   - Modos de conexión explícitos: `CONNECTED`, `STALE`, `DISCONNECTED`, `AUTH_ERROR` y `DEMO_MODE`.
   - **Modo Demostración (Demo Mode)** aislado para desarrollo y visualización de estados sin alterar ni falsear los datos reales.

4. **Sistema Notificaciones Nativas & Sonido HUD**:
   - Alertas nativas del sistema cuando una cuota baja del 25%, del 10% (crítica) o llega a 0%.
   - Notificación de activación de *AI Credit Overages*.
   - Cooldown configurable (período de silencio) para prevenir notificaciones duplicadas.
   - Efectos de sonido HUD synthesized con *Web Audio API*.

5. **Modo Compacto & Modo Expandido**:
   - **Modo Expandido**: Vista completa con todas las métricas, tarjetas detalladas y sparklines.
   - **Modo Compacto**: Barrita minimalista de alta densidad con créditos, salud y medidores de 5h.
   - Ventana sin marco (*Frameless*), arrastrable (*Drag & Drop*), opacidad ajustable y fijable al frente (*Always-on-top*).

---

## 🏗️ Arquitectura del Proyecto

```
src/
├── types/
│   └── quota.ts               # Definiciones de tipos estrictos TypeScript (QuotaSnapshot, CreditStatus, etc.)
├── providers/
│   └── AntigravityQuotaProvider.ts # Capa de abstracción para la lectura y normalización de cuotas
├── services/
│   ├── notificationService.ts # Gestión de notificaciones nativas, reglas de umbral y sonidos SFX
│   └── storageService.ts      # Persistencia local segura de configuración e historial
├── components/
│   ├── Header.tsx             # Encabezado con estado de conexión, sync manual y controles de ventana
│   ├── SummaryCard.tsx        # Resumen superior de créditos, overages y arco de salud global
│   ├── ModelQuotaCard.tsx     # Tarjeta detallada para modelos Gemini y Claude/GPT con sparklines
│   ├── FooterStatus.tsx       # Pie con cuenta regresiva, velocidad tok/s y contador de alertas
│   ├── CompactWidget.tsx      # Barrita compacta de escritorio estilo macOS Sonoma
│   └── SettingsModal.tsx      # Panel de configuración de opacidad, notificaciones y Modo Demo
├── styles/
│   └── index.css              # Estilos Tailwind CSS + utilidades glassmorphism
└── App.tsx                    # Orquestador principal de estado y renders
```

---

## 💻 Instalación y Ejecución en Windows / macOS

### 1. Ejecutar Servidor Web / Vista Local:
```bash
npm run dev
# o bien
node server.js
```
Accede desde tu navegador en:  
👉 **[http://localhost:4600](http://localhost:4600)**

### 2. Compilar Producción Vite:
```bash
npm run build
```

### 3. Ejecutar como Aplicación Novedosa de Escritorio (Electron):
```bash
npm run electron
```

---

## 📄 Licencia y Autores

Desarrollado para la suite **Antigravity IDE** — © 2026.
