# TDD - Supervielle Chatbot Demo

## 1. Propósito

Este documento describe el diseño técnico del prototipo **Supervielle Chatbot Demo**, una aplicación web local que simula un chatbot estilo WhatsApp para consultar y gestionar débitos automáticos adheridos a tarjeta de débito.

El objetivo del proyecto es servir como demo visual e interactiva para exposición, sin conexión a sistemas reales del banco, WhatsApp, biometría, APIs externas ni almacenamiento de datos sensibles.

## 2. Alcance Funcional

La aplicación cubre tres fases de negocio:

| Fase | Objetivo | Comportamiento |
| --- | --- | --- |
| Fase 1 | Consulta segura y visibilidad | El cliente navega hasta Débitos automáticos, valida identidad de forma simulada y descarga un PDF informativo. |
| Fase 2 | Autogestión parcial | El cliente puede consultar débitos, recibir instrucciones para desconocimiento y pedir baja informando una referencia mock. |
| Fase 3 | Trazabilidad y estado | Replica Fase 2 y agrega estado de pago en el PDF generado. |

La funcionalidad aplica únicamente a débitos automáticos adheridos a **tarjeta de débito**.

## 3. Stack Técnico

- **React**: construcción de la interfaz y manejo de estado.
- **Vite**: servidor local, build y tooling frontend.
- **CSS puro**: layout, estética tipo WhatsApp, modales y responsive.
- **Vitest**: ejecución de tests.
- **Testing Library**: pruebas de renderizado e interacción.
- **jsdom**: entorno DOM para tests.
- **PDF local con Blob**: generación de PDF en navegador sin backend.

## 4. Arquitectura General

La aplicación es una SPA frontend. Todo el flujo vive en memoria del navegador.

```text
Usuario
  |
  v
React App
  |
  |-- Estado conversacional
  |-- Componentes visuales
  |-- Datos mock
  |-- Generador local de PDF
  |
  v
Navegador local
```

No existe backend, base de datos, autenticación real, integración bancaria ni servicios remotos.

## 5. Estructura de Archivos

```text
.
|-- index.html
|-- package.json
|-- vite.config.js
|-- README.md
|-- TDD.md
|-- public/
|   |-- logopngsupervielle.png
|   |-- supervielle-chat-logo.jpg
|   `-- wallpaper.png
`-- src/
    |-- main.jsx
    |-- styles.css
    |-- App.test.jsx
    |-- setupTests.js
    |-- components/
    |   |-- BiometricModal.jsx
    |   |-- ChatHeader.jsx
    |   |-- DemoControls.jsx
    |   |-- MenuModal.jsx
    |   |-- MessageBubble.jsx
    |   `-- PdfAttachment.jsx
    |-- data/
    |   `-- mockDebits.js
    `-- utils/
        `-- generatePdf.js
```

## 6. Componentes Principales

### `main.jsx`

Contiene el componente `App`, el estado principal y la lógica conversacional.

Responsabilidades:

- Renderizar la estructura general.
- Mantener historial de mensajes.
- Controlar la fase activa.
- Abrir y cerrar menús.
- Manejar validación biométrica simulada.
- Generar respuestas según acciones del usuario.
- Delegar generación de PDF.

### `DemoControls.jsx`

Panel lateral de control para exposición.

Responsabilidades:

- Seleccionar Bot Fase 1, Bot Fase 2 o Bot Fase 3.
- Reiniciar la fase actual.
- Mostrar controles demo solo cuando está activa Fase 1.

### `MessageBubble.jsx`

Renderiza mensajes tipo WhatsApp.

Responsabilidades:

- Diferenciar mensajes de bot y usuario.
- Mostrar hora.
- Mostrar acciones rápidas.
- Alojar adjuntos como el PDF.

### `MenuModal.jsx`

Renderiza menús tipo lista.

Responsabilidades:

- Mostrar Menú Principal.
- Mostrar Menú Tarjetas.
- Permitir selección de opción.
- Mantener botón Enviar visible.

### `BiometricModal.jsx`

Simula validación facial.

Responsabilidades:

- Mostrar animación visual.
- Simular éxito o error.
- Continuar el flujo sin usar biometría real.

### `PdfAttachment.jsx`

Representa el archivo adjunto del PDF dentro del chat.

Responsabilidades:

- Mostrar nombre del archivo.
- Ejecutar descarga al hacer click.

### `generatePdf.js`

Genera el PDF localmente.

Responsabilidades:

- Crear contenido PDF con datos mock.
- Incluir o no columna `Estado` según fase.
- Descargar el archivo con `Blob`.
- Codificar acentos usando `WinAnsiEncoding`.

## 7. Modelo de Estado

El estado principal vive en `App`.

| Estado | Tipo | Uso |
| --- | --- | --- |
| `messages` | array | Historial de burbujas del chat. |
| `input` | string | Texto escrito por el usuario. |
| `currentStep` | string | Paso actual del flujo. |
| `openMenu` | string/null | Modal abierto: principal o tarjetas. |
| `selectedMainMenuOption` | string | Opción seleccionada en Menú Principal. |
| `selectedCardMenuOption` | string | Opción seleccionada en Menú Tarjetas. |
| `retryCount` | number | Conteo de mensajes no comprendidos. |
| `demoMode` | string | Modo normal, sin débitos, error técnico o biometría fallida. |
| `activePhase` | number | Fase activa: 1, 2 o 3. |
| `pdfIncludesStatus` | boolean | Define si el PDF incluye estado. |
| `pendingDebitCancel` | boolean | Indica si el bot espera una referencia para baja. |
| `biometricOpen` | boolean | Controla el modal biométrico. |

## 8. Flujo de Fase 1

1. Usuario inicia demo.
2. Bot valida DNI terminado en 965.
3. Usuario abre Menú Principal.
4. Usuario selecciona Tarjetas.
5. Usuario abre Menú Tarjetas.
6. Usuario selecciona Débitos automáticos.
7. Bot solicita validación biométrica simulada.
8. Se consulta el resultado según `demoMode`.
9. En modo normal se genera un PDF informativo.
10. El usuario puede volver al menú o finalizar.

Casos especiales:

- Cliente sin débitos.
- Error técnico con derivación a ejecutivo.
- Error biométrico con derivación.
- Tres mensajes desconocidos derivan a ejecutivo.

## 9. Flujo de Fase 2

Fase 2 carga un chat prearmado con las mismas adhesiones mock.

Opciones:

- **Desconocer débito automático**: el bot informa que el reclamo debe realizarse desde homebanking y lista los pasos.
- **Dar de baja débito automático**: el bot solicita la referencia del débito.

Si el usuario ingresa una referencia válida del PDF, por ejemplo `DEB-AUT-001`, el bot confirma la solicitud y aclara:

- El banco no cancela el servicio.
- El banco no rescinde el contrato con la empresa asociada.
- El débito automático con esa referencia ya no se volverá a cobrar en la tarjeta de débito.

Si la referencia no existe, el bot pide revisar el código.

## 10. Flujo de Fase 3

Fase 3 es un clon funcional de Fase 2.

Diferencia técnica:

- El adjunto PDF se genera con `includeStatus = true`.
- El PDF agrega la columna `Estado`.

Estados mock:

- `Pagado`
- `No pagado`
- `Pendiente de procesamiento`

## 11. Datos Mock

Los datos viven en `src/data/mockDebits.js`.

Cada débito contiene:

```js
{
  service: 'Netflix Argentina',
  reference: 'DEB-AUT-001',
  card: '****4821',
  status: 'Pagado'
}
```

Estos datos se usan para:

- Listado del PDF.
- Validación de referencias para baja.
- Estados de Fase 3.

## 12. Generación de PDF

La generación se realiza en frontend con:

- Construcción manual de estructura PDF.
- `Blob` para descarga local.
- `URL.createObjectURL`.

Parámetro clave:

```js
downloadDebitsPdf({ debits, includeStatus })
```

Cuando `includeStatus` es `false`, el PDF corresponde a Fase 1 o Fase 2.

Cuando `includeStatus` es `true`, el PDF corresponde a Fase 3 e incluye la columna `Estado`.

## 13. UI y Diseño

La interfaz prioriza:

- Estética WhatsApp modo oscuro.
- Burbujas diferenciadas para bot y usuario.
- Botones grandes para exposición.
- Menús tipo modal/lista.
- Fondo institucional con `wallpaper.png`.
- Logo del chat y favicon con assets Supervielle.
- Layout pensado para notebook/proyector.

El panel lateral permite controlar la fase activa y, en Fase 1, escenarios demo.

## 14. Testing

Los tests están en `src/App.test.jsx`.

Cobertura actual:

- Render del selector de fases.
- Inicio del flujo de Fase 1.
- Carga de Fase 3 con las mismas opciones operativas que Fase 2.

Comando:

```bash
npm test
```

Setup:

- `src/setupTests.js` agrega matchers de jest-dom.
- Se mockea `scrollIntoView`, no implementado por jsdom.

## 15. Comandos

Instalar dependencias:

```bash
npm install
```

Servidor local:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Tests:

```bash
npm test
```

## 16. Restricciones y Supuestos

- No se usan APIs reales.
- No se almacenan datos.
- No se solicita DNI real.
- No se implementa biometría real.
- No se ejecutan bajas reales.
- No se ejecutan desconocimientos reales.
- El proyecto es exclusivamente demostrativo.

## 17. Riesgos Técnicos

| Riesgo | Mitigación |
| --- | --- |
| El navegador cachea favicon/assets | Hard refresh o limpiar cache. |
| PDF con caracteres especiales | Uso de `WinAnsiEncoding` y escapes controlados. |
| Layout en pantallas pequeñas | CSS responsive y scroll interno en secciones. |
| Tests fallan por APIs no implementadas en jsdom | Mocks en `setupTests.js`. |

## 18. Extensibilidad

Posibles mejoras futuras:

- Separar la máquina de estados del componente `App`.
- Mover textos largos a archivos de configuración.
- Agregar tests para baja por referencia.
- Agregar tests para generación de PDF Fase 3.
- Agregar una vista de historial o reset por escenario.
- Internacionalizar textos si la demo crece.

## 19. Adenda - Desconocimiento de Consumos

Luego de la presentación del prototipo inicial se amplió el alcance funcional porque el volumen de casos de desconocimiento de débitos automáticos no justificaba por sí solo la implementación. La solución incorpora ahora **desconocimiento de consumo en tarjeta de débito y crédito** dentro de `Menú Tarjetas`.

La definición funcional vigente por fase es:

| Fase | Alcance |
| --- | --- |
| Fase 1 | Listado de débitos automáticos adheridos. |
| Fase 2 | Desconocimiento de débitos automáticos y desconocimiento de consumos en tarjeta de débito. |
| Fase 3 | Estado de pago del débito automático en el mes actual y desconocimiento de consumos en tarjeta de crédito. |

### Opciones de Menú por Fase

En `Menú Tarjetas` se muestran opciones según la fase activa:

- Fase 1: `Listado de débitos automáticos`.
- Fase 2: `Desconocimiento de débito automático` y `Desconocimiento de consumo TD`.
- Fase 3: `Estado de pago del débito` y `Desconocimiento de consumo TC`, manteniendo las capacidades de Fase 2.

La opción de `Débitos automáticos` se mantiene para consulta, baja simulada y trazabilidad de débitos.

### Flujo de Tarjeta de Crédito

1. Usuario selecciona `Desconocimiento de consumo TC` bajo Tarjeta de Crédito.
2. Se solicita validación biométrica simulada.
3. El bot solicita elegir la tarjeta de crédito.
4. El bot muestra consumos recientes.
5. El usuario selecciona el consumo no reconocido.
6. El bot realiza preguntas operativas:
   - Si tuvo contacto con el comercio.
   - Si conserva la tarjeta física.
7. El bot genera un número de reclamo simulado.

### Flujo de Tarjeta de Débito

1. Usuario selecciona `Desconocimiento de consumo TD` bajo Tarjeta de Débito.
2. Se solicita validación biométrica simulada.
3. El bot muestra consumos recientes de la tarjeta de débito.
4. El usuario selecciona el consumo no reconocido.
5. El bot realiza las mismas preguntas operativas.
6. El bot genera un número de reclamo simulado.

### Datos Solicitados para Reclamo TD/TC

Antes de generar el reclamo, el bot solicita:

- Mail de contacto para enviar la devolución del reclamo.
- Tipo de desconocimiento:
  - `Consumo cuestionado`
  - `Consumo duplicado`
  - `Desconocimiento de consumo`
  - `Otro`
- Confirmación de si la compra está duplicada.
- Confirmación de si hubo problema con la entrega del producto.
- Notas opcionales del reclamo.

El número de reclamo generado por el prototipo es fijo:

```text
R123456789
```

### Columnas de Consumos Recientes

Los consumos se modelan con columnas alineadas a lo observado en el proceso operativo y resumen de tarjeta:

| Campo | Descripción |
| --- | --- |
| `date` | Fecha del consumo. |
| `time` | Hora del consumo. |
| `business` | Nombre del comercio. |
| `amount` | Importe del consumo. |
| `currency` | Moneda del consumo. |
| `voucher` | Cupón o comprobante. |
| `card` | Numeración enmascarada de tarjeta utilizada. |

### Datos Mock

Los nuevos datos viven en `src/data/mockTransactions.js`.

Incluyen:

- Tarjetas de crédito mock.
- Tarjeta de débito mock.
- Consumos recientes de tarjeta de crédito.
- Consumos recientes de tarjeta de débito.

### Testing Actualizado

Los tests ahora verifican que:

- El flujo de Fase 1 inicia correctamente.
- El Menú Tarjetas muestra dos opciones de `Desconocimiento de consumo`, una para crédito y otra para débito.
- Fase 3 mantiene desconocimiento de consumo y baja de débito automático.
