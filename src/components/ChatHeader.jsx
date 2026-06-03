export function ChatHeader() {
  return (
    <header className="chat-header">
      <div className="back">‹</div>
      <div className="brand-mark" aria-hidden="true">
        <img src="/supervielle-chat-logo.jpg" alt="" />
      </div>
      <div className="header-copy">
        <div className="header-title">
          Supervielle Chat <span className="verified">✓</span>
        </div>
        <div className="header-status">en línea</div>
      </div>
      <div className="header-actions" aria-hidden="true">
        <span>⌕</span>
        <span>⋮</span>
      </div>
    </header>
  );
}
