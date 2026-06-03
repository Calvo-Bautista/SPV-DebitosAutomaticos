export function MenuModal({
  title,
  options,
  sections,
  selectedId,
  onSelect,
  onClose,
  onSubmit,
  footer
}) {
  const grouped = sections ?? [{ section: null, items: options }];

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={title}>
      <div className="menu-modal">
        <div className="modal-header">
          <span />
          <h2>{title}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar menú">×</button>
        </div>
        <div className="menu-list">
          {grouped.map((group) => (
            <section className="menu-section" key={group.section ?? 'default'}>
              {group.section && <h3>{group.section}</h3>}
              {group.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`menu-option ${selectedId === item.id ? 'selected' : ''} ${item.featured ? 'featured' : ''}`}
                  onClick={() => onSelect(item.id)}
                >
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.description}</small>
                  </span>
                  {item.badge && <em>{item.badge}</em>}
                  {selectedId === item.id && <b aria-hidden="true">✓</b>}
                </button>
              ))}
            </section>
          ))}
        </div>
        <button type="button" className="submit-menu" onClick={onSubmit}>Enviar</button>
        {footer && <p className="modal-footer">{footer}</p>}
      </div>
    </div>
  );
}
