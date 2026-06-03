import { useEffect, useState } from 'react';

export function BiometricModal({ shouldFail, onClose, onContinue }) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDone(true), 1600);
    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Validación facial biométrica">
      <div className="biometric-modal">
        <button type="button" className="close-floating" onClick={onClose} aria-label="Cerrar">×</button>
        <div className={`face-scan ${done ? 'scan-complete' : ''}`} aria-hidden="true">
          <div className="face">
            <span />
            <span />
            <i />
          </div>
        </div>
        <h2>{done ? (shouldFail ? 'No pudimos validar tu identidad' : 'Validación exitosa') : 'Validando identidad...'}</h2>
        <p>
          {done
            ? shouldFail
              ? 'La demo continuará con derivación a ejecutivo.'
              : 'Identidad validada para consultar información financiera.'
            : 'Mantené el rostro dentro del marco. Esta es una simulación visual.'}
        </p>
        <button type="button" className="submit-menu" disabled={!done} onClick={onContinue}>
          Continuar
        </button>
      </div>
    </div>
  );
}
