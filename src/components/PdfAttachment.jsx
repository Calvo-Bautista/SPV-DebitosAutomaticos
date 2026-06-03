export function PdfAttachment({ onOpen }) {
  return (
    <button type="button" className="pdf-card" onClick={onOpen}>
      <span className="pdf-icon">PDF</span>
      <span>
        <strong>Tus_Debitos_Supervielle.pdf</strong>
        <small>Documento digital listo para descargar</small>
      </span>
    </button>
  );
}
