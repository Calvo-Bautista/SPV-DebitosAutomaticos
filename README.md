# Supervielle Chatbot Demo

Prototipo web local que simula una conversación tipo WhatsApp con **Supervielle Chat** para demostrar flujos de gestión dentro del menú **Tarjetas**.

El proyecto no se conecta a WhatsApp, APIs bancarias ni servicios externos. Usa datos mockeados y está pensado para una exposición presencial o demo funcional en navegador.

## Finalidad

El prototipo representa una solución conversacional para:

- Consulta de débitos automáticos adheridos a tarjeta de débito.
- Baja simulada de débitos automáticos por referencia.
- Desconocimiento de consumos en tarjeta de débito.
- Desconocimiento de consumos en tarjeta de crédito.

El recorrido base es:

```text
Menú Principal > Tarjetas > Menú Tarjetas
```

Dentro de `Menú Tarjetas` se agregan opciones específicas para:

- `Débitos automáticos`
- `Desconocimiento de consumo` bajo Tarjeta de Crédito
- `Desconocimiento de consumo` bajo Tarjeta de Débito

## Fases Simuladas

### Fase 1

Listado de débitos automáticos:

- Validación inicial por DNI.
- Acceso por Menú Principal y Menú Tarjetas.
- Validación biométrica simulada.
- Consulta de listado de débitos automáticos.
- PDF informativo con adhesiones vigentes.
- Casos demo: sin registros, error técnico y biometría fallida.

### Fase 2

Desconocimientos en débito:

- Desconocimiento de débitos automáticos.
- Desconocimiento de consumos en tarjeta de débito.
- Selección de consumo reciente de TD.
- Registro guiado del reclamo.

### Fase 3

Estado mensual y crédito:

- Estado de pago del débito automático en el mes actual.
- PDF con columna `Estado`.
- Desconocimiento de consumos en tarjeta de crédito.
- Selección de tarjeta de crédito y consumo reciente.

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
    mockTransactions.js    Tarjetas y consumos recientes mockeados
  utils/
    generatePdf.js         Generador local de PDF sin backend
  main.jsx                 Estado principal, flujo conversacional y render
  styles.css               Estilos globales y layout responsive
```

## Datos de Consumos y Reclamos

Los consumos recientes usan columnas alineadas al proceso operativo observado:

- Fecha
- Hora
- Comercio
- Importe
- Cupón o comprobante
- Tarjeta utilizada

En tarjeta de crédito primero se selecciona la tarjeta y luego el consumo. En tarjeta de débito se muestran directamente los consumos recientes de la tarjeta mock.

Para desconocimiento de consumo TD/TC, el bot solicita:

- Mail de contacto para enviar la devolución.
- Tipo de desconocimiento: `Consumo cuestionado`, `Consumo duplicado`, `Desconocimiento de consumo` u `Otro`.
- Si la compra está duplicada.
- Si hubo problema con la entrega del producto.
- Notas opcionales del cliente.

El número de reclamo simulado generado es fijo:

```text
R123456789
```

## Stack

- React
- Vite
- CSS puro
- Vitest
- Testing Library
- jsdom

## Cómo correr el proyecto

```bash
npm install
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

## Tests

```bash
npm test
```

Los tests montan la App en jsdom y verifican que:

- Renderice el selector de fases.
- El flujo de Fase 1 pueda iniciar.
- Fase 1 muestre listado de débitos automáticos.
- Fase 2 muestre desconocimiento de débito automático y consumo TD.
- Fase 3 agregue estado de débito mensual y consumo TC.

## Notas de Seguridad

- No pide DNI real.
- No implementa biometría real.
- No almacena datos sensibles.
- No ejecuta bajas ni desconocimientos reales.
- No usa información bancaria real.
