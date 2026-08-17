import React, { useEffect } from 'react';
import { Trophy, Frown, RotateCcw, Home, Sparkles } from 'lucide-react';
import { soundFx } from '../game/soundEffects.js';

export function VictoryDefeatModal({
  winner,
  playerSide = 'p1',
  p1Name = 'Player 1',
  p2Name = 'Player 2',
  p1Team = [],
  p2Team = [],
  turnCount = 1,
  onRematch,
  onReturnToLobby
}) {
  const isWinner = winner === playerSide;
  const isDraw = winner === 'draw';

  useEffect(() => {
    if (isWinner) {
      soundFx.playVictory();
    }
  }, [isWinner]);

  const winningTrainer = winner === 'p1' ? p1Name : p2Name;
  const myTeam = playerSide === 'p1' ? p1Team : p2Team;
  const remainingAlive = myTeam.filter(p => p.currentHp > 0 && !p.isFainted).length;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: `2px solid ${isWinner ? 'var(--accent-gold)' : isDraw ? 'var(--accent-blue)' : 'var(--accent-red)'}`,
          borderRadius: 'var(--radius-lg)',
          maxWidth: '520px',
          width: '100%',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          boxShadow: 'var(--shadow-main)',
          animation: 'shake 0.5s ease'
        }}
      >
        {/* Icon */}
        <div
          style={{
            display: 'inline-flex',
            padding: '1.25rem',
            background: isWinner
              ? 'rgba(245, 158, 11, 0.15)'
              : isDraw
              ? 'rgba(59, 130, 246, 0.15)'
              : 'rgba(239, 68, 68, 0.15)',
            borderRadius: '50%',
            color: isWinner ? 'var(--accent-gold)' : isDraw ? 'var(--accent-blue)' : 'var(--accent-red)',
            marginBottom: '1rem'
          }}
        >
          {isWinner ? <Trophy size={56} /> : isDraw ? <Sparkles size={56} /> : <Frown size={56} />}
        </div>

        {/* Title */}
        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '2.5rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: isWinner ? 'var(--accent-gold)' : isDraw ? '#60a5fa' : 'var(--accent-red)',
            marginBottom: '0.5rem'
          }}
        >
          {isWinner ? 'VICTORY!' : isDraw ? 'DRAW MATCH' : 'DEFEAT'}
        </h1>

        <p style={{ color: 'var(--text-sub)', fontSize: '1.1rem', marginBottom: '1.5rem' }}>
          {isWinner
            ? `Congratulations! ${winningTrainer} defeated the opposing team in ${turnCount} turns!`
            : isDraw
            ? `Both teams fell in battle simultaneously after ${turnCount} intense turns.`
            : `${winningTrainer} emerged victorious. Better luck next time!`}
        </p>

        {/* Team Summary Cards */}
        <div
          style={{
            background: '#0d1117',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginBottom: '1.75rem',
            display: 'flex',
            justifyContent: 'space-around',
            fontSize: '0.9rem'
          }}
        >
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Remaining Pokémon</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.25rem', color: '#fff' }}>
              {remainingAlive} / {myTeam.length}
            </div>
          </div>
          <div style={{ width: '1px', background: 'var(--border-color)' }} />
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Turns Fought</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.25rem', color: 'var(--accent-gold)' }}>
              {turnCount}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            className="btn-primary"
            onClick={onRematch}
            style={{ padding: '0.8rem 1.5rem' }}
          >
            <RotateCcw size={18} /> Rematch
          </button>

          <button
            className="btn-secondary"
            onClick={onReturnToLobby}
            style={{ padding: '0.8rem 1.5rem' }}
          >
            <Home size={18} /> Return to Lobby
          </button>
        </div>
      </div>
    </div>
  );
}
