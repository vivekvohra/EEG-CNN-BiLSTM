export function SystemErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', textAlign: 'center' }}>
      <i className="fas fa-exclamation-circle" style={{ fontSize: '4rem', color: 'var(--error)', marginBottom: '1rem' }} />
      <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
        Diagnostic System Offline
      </h2>
      <p style={{ color: 'var(--text-muted)', maxWidth: '500px', marginBottom: '2rem' }}>
        An unexpected critical failure occurred within the application layer. The system has safely halted to prevent data corruption.
      </p>
      <div style={{ background: 'var(--bg-panel)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '2rem', width: '100%', maxWidth: '600px', textAlign: 'left', overflowX: 'auto' }}>
        <code style={{ color: 'var(--error)', fontSize: '0.9rem' }}>{error.message}</code>
      </div>
      <button className="btn" onClick={resetErrorBoundary}>
        <i className="fas fa-sync-alt" style={{ marginRight: '8px' }} />
        Restart Diagnostic Engine
      </button>
    </div>
  );
}
