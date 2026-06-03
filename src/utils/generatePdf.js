function byteLength(value) {
  return new TextEncoder().encode(value).length;
}

const winAnsi = new Map([
  ['\u00e1', 0xe1],
  ['\u00e9', 0xe9],
  ['\u00ed', 0xed],
  ['\u00f3', 0xf3],
  ['\u00fa', 0xfa],
  ['\u00c1', 0xc1],
  ['\u00c9', 0xc9],
  ['\u00cd', 0xcd],
  ['\u00d3', 0xd3],
  ['\u00da', 0xda],
  ['\u00f1', 0xf1],
  ['\u00d1', 0xd1],
  ['\u00fc', 0xfc],
  ['\u00dc', 0xdc],
  ['\u00bf', 0xbf],
  ['\u00a1', 0xa1]
]);

function toWinAnsiByte(char) {
  const code = char.charCodeAt(0);
  if (code >= 0x20 && code <= 0x7e) return code;
  return winAnsi.get(char) ?? 0x3f;
}

function pdfText(value) {
  let output = '(';
  for (const char of String(value)) {
    const byte = toWinAnsiByte(char);
    if (byte === 0x28 || byte === 0x29 || byte === 0x5c) {
      output += `\\${String.fromCharCode(byte)}`;
    } else if (byte < 0x20 || byte > 0x7e) {
      output += `\\${byte.toString(8).padStart(3, '0')}`;
    } else {
      output += String.fromCharCode(byte);
    }
  }
  return `${output})`;
}

function line(text, x, y, size = 12, font = 'F1') {
  return `BT /${font} ${size} Tf ${x} ${y} Td ${pdfText(text)} Tj ET`;
}

export function downloadDebitsPdf({ debits, includeStatus = false }) {
  const generatedAt = new Intl.DateTimeFormat('es-AR').format(new Date());
  const title = includeStatus
    ? 'Listado de d\u00e9bitos autom\u00e1ticos con estado'
    : 'Listado de d\u00e9bitos autom\u00e1ticos adheridos';
  const footer = includeStatus
    ? 'Fase 3 simulada: los estados reflejan pagado, no pagado o pendiente.'
    : 'Documento informativo generado para prototipo. No contiene datos reales.';

  const content = [
    line(title, 54, 780, 18, 'F2'),
    line('Banco Supervielle - Tarjeta de D\u00e9bito', 54, 754, 13),
    line('Cliente: Cliente Demo', 54, 710),
    line('DNI: ********965', 54, 690),
    line('Tarjeta de d\u00e9bito: **** **** **** 4821', 54, 670),
    line(`Fecha de generaci\u00f3n: ${generatedAt}`, 54, 650),
    line('Servicio', 54, 600, 12, 'F2'),
    line('Referencia', includeStatus ? 230 : 260, 600, 12, 'F2'),
    line('Tarjeta', includeStatus ? 355 : 420, 600, 12, 'F2'),
    ...(includeStatus ? [line('Estado', 445, 600, 12, 'F2')] : []),
    '0.8 w 54 590 m 540 590 l S',
    ...debits.flatMap((debit, index) => {
      const y = 565 - index * 28;
      return [
        line(debit.service, 54, y),
        line(debit.reference, includeStatus ? 230 : 260, y),
        line(debit.card, includeStatus ? 355 : 420, y),
        ...(includeStatus ? [line(debit.status, 445, y, 10)] : [])
      ];
    }),
    line(footer, 54, 90, 10)
  ].join('\n');

  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >> endobj',
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >> endobj',
    `6 0 obj << /Length ${byteLength(content)} >> stream\n${content}\nendstream endobj`
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object) => {
    offsets.push(byteLength(pdf));
    pdf += `${object}\n`;
  });
  const xrefPosition = byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPosition}\n%%EOF`;

  const blob = new Blob([pdf], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = includeStatus
    ? 'Tus_Debitos_Supervielle_Fase_3.pdf'
    : 'Tus_Debitos_Supervielle.pdf';
  link.click();
  URL.revokeObjectURL(url);
}
