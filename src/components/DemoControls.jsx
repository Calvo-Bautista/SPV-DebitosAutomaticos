const modes = [
  { id: 'normal', label: 'Flujo con débitos' },
  { id: 'noDebits', label: 'Modo sin débitos' },
  { id: 'technicalError', label: 'Simular error técnico' },
  { id: 'biometricError', label: 'Biometría fallida' }
];

const phases = [
  { id: 1, label: 'Bot Fase 1', detail: 'Consulta y PDF informativo' },
  { id: 2, label: 'Bot Fase 2', detail: 'Autogestión parcial simulada' },
  { id: 3, label: 'Bot Fase 3', detail: 'Trazabilidad y estados' }
];

export function DemoControls({ demoMode, activePhase, onModeChange, onReset, onSelectPhase }) {
  return (
    <aside className="demo-controls" aria-label="Controles demo">
      <div>
        <p className="eyebrow">Prototipo local</p>
        <h1>Gestión inteligente de débitos automáticos</h1>
        <p>
          Simulación visual del recorrido Menú Principal &gt; Tarjetas &gt; Menú Tarjetas &gt; Débitos automáticos.
        </p>
      </div>

      <div className="phase-chat-box">
        <h2>Seleccionar fase</h2>
        {phases.map((phase) => (
          <button
            key={phase.id}
            type="button"
            className={activePhase === phase.id ? 'active' : ''}
            onClick={() => onSelectPhase(phase.id)}
          >
            <strong>{phase.label}</strong>
            <small>{phase.detail}</small>
          </button>
        ))}
      </div>

      <button type="button" className="reset-button" onClick={onReset}>Reiniciar fase actual</button>

      {activePhase === 1 && (
        <div className="mode-group">
          <h2>Controles demo</h2>
          {modes.map((mode) => (
            <label key={mode.id} className="mode-option">
              <input
                type="radio"
                name="demo-mode"
                checked={demoMode === mode.id}
                onChange={() => onModeChange(mode.id)}
              />
              <span>{mode.label}</span>
            </label>
          ))}
        </div>
      )}
    </aside>
  );
}
