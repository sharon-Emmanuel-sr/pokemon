import React, { useEffect, useRef } from 'react';
import { ScrollText } from 'lucide-react';

export function BattleLog({ logs = [] }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        flexDirection: 'column',
        height: '190px',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.5rem 0.85rem',
          background: 'rgba(13, 17, 23, 0.8)',
          borderBottom: '1px solid var(--border-color)',
          fontFamily: 'var(--font-heading)',
          fontSize: '0.85rem',
          fontWeight: 700,
          color: 'var(--text-sub)'
        }}
      >
        <ScrollText size={15} color="var(--accent-gold)" />
        BATTLE LOG
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem',
          fontSize: '0.85rem'
        }}
      >
        {logs.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.5rem' }}>
            Battle initiated. Awaiting first turn actions...
          </div>
        ) : (
          logs.map((entry, idx) => (
            <div key={idx} className={`log-entry ${entry.type || 'info'}`}>
              {entry.message}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
