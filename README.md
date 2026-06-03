# Supervielle Chatbot Demo

Prototipo web local que simula una conversación tipo WhatsApp con **Supervielle Chat** para demostrar el flujo de consulta y gestión de débitos automáticos adheridos a tarjeta de débito.

El proyecto no se conecta a WhatsApp, APIs bancarias ni servicios externos. Usa datos mockeados y está pensado para una exposición presencial o demo funcional en navegador.

## Finalidad

El prototipo representa la solución **Gestión inteligente de débitos automáticos** dentro del chatbot de WhatsApp de Banco Supervielle.

El recorrido base es:

```text
Menú Principal > Tarjetas > Menú Tarjetas > Débitos automáticos
```

La funcionalidad aplica solo a débitos automáticos adheridos a **tarjeta de débito**. No opera sobre cuentas, tarjetas de crédito ni otros productos.

## Fases Simuladas

### Fase 1

Consulta segura y visibilidad:

- Validación inicial por DNI.
- Acceso por Menú Principal y Menú Tarjetas.
- Validación biométrica simulada.
- Generación de PDF informativo con débitos automáticos adheridos.
- Casos demo: cliente sin débitos, error técnico y biometría fallida.

### Fase 2

Autogestión parcial simulada:

- Mismo listado de débitos automáticos.
- Opción para desconocer débito automático con instrucciones de homebanking.
- Opción para pedir baja ingresando la referencia mock del débito.
- Aclara que el banco no cancela el servicio ni rescinde el contrato con la empresa asociada.

### Fase 3

Trazabilidad y estado:

- Clona el comportamiento de Fase 2.
- El PDF agrega la columna `Estado`.
- Estados mockeados: `Pagado`, `No pagado` y `Pendiente de procesamiento`.

## Arquitectura

La aplicación está construida como SPA con React y Vite.

```text
src/
  components/
    BiometricModal.jsx     Modal de validación facial simulada
    ChatHeader.jsx         Header tipo WhatsApp con logo Supervielle
    DemoControls.jsx       Selector de fases y controles demo
    MenuModal.jsx          Menús tipo lista de WhatsApp
    MessageBubble.jsx      Burbujas de mensajes y acciones
    PdfAttachment.jsx      Tarjeta de adjunto PDF
  data/
    mockDebits.js          Débitos y estados mockeados
  utils/
    generatePdf.js         Generador local de PDF sin backend
  main.jsx                 Estado principal, flujo conversacional y render
  styles.css               Estilos globales y layout responsive
```

Los assets estáticos viven en `public/`:

- `supervielle-chat-logo.jpg`
- `wallpaper.png`

## Funcionamiento

El estado principal vive en `src/main.jsx`:

- `messages`: historial del chat.
- `currentStep`: etapa del flujo conversacional.
- `activePhase`: fase seleccionada del bot.
- `demoMode`: modo normal, sin débitos, error técnico o biometría fallida.
- `pendingDebitCancel`: espera la referencia del débito para simular la baja.
- `pdfIncludesStatus`: define si el PDF incluye la columna `Estado`.

Los botones del chat disparan acciones internas. No hay backend ni persistencia real.

El PDF se genera en el navegador con `Blob` y contenido PDF construido localmente. Para textos con acentos se usa codificación compatible con `WinAnsiEncoding`.

## Stack

- React
- Vite
- CSS puro
- Vitest
- Testing Library
- jsdom

## Cómo correr el proyecto

Instalar dependencias:

```bash
npm install
```

Levantar el servidor local:

```bash
npm run dev
```

Abrir:

```text
http://127.0.0.1:5173/
```

## Build

```bash
npm run build
```

El build de producción se genera en `dist/`.

## Tests

```bash
npm test
```

Los tests montan la App en jsdom y verifican que:

- Renderice el selector de fases.
- El flujo de Fase 1 pueda iniciar.
- Fase 3 cargue las mismas opciones de gestión que Fase 2.

## Notas de Seguridad

- No pide DNI real.
- No implementa biometría real.
- No almacena datos sensibles.
- No ejecuta bajas ni desconocimientos reales.
- No usa información bancaria real.
