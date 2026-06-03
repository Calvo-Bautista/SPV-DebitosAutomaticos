function formatTime(date) {
  return new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function MessageBubble({ message, onAction, children }) {
  return (
    <article className={`message-row ${message.from === 'user' ? 'message-row-user' : ''}`}>
      <div className={`bubble ${message.from === 'user' ? 'bubble-user' : 'bubble-bot'}`}>
        {message.text && <p>{message.text}</p>}
        {children}
        <span className="bubble-time">{formatTime(message.time)}</span>
      </div>
      {message.actions?.length > 0 && (
        <div className="quick-actions">
          {message.actions.map((action) => (
            <button key={action.action} type="button" onClick={() => onAction(action.action)}>
              {action.label}
            </button>
          ))}
        </div>
      )}
    </article>
  );
}
