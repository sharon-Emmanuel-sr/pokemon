import React, { useState } from 'react';
import { TYPE_COLORS } from '../data/typeChart.js';
import { ArrowLeftRight, Flag, Shield, Sparkles, X, Info } from 'lucide-react';
import { soundFx } from '../game/soundEffects.js';

export function BattleControls({
  activePokemon,
  team = [],
  activeIndex = 0,
  onSelectMove,
  onSelectSwitch,
  onForfeit,
  isWaiting = false,
  isForcedSwitch = false,
  disabled = false
}) {
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const moves = activePokemon?.moves || [];

  const handleMoveClick = (moveIndex) => {
    soundFx.playClick();
    onSelectMove(moveIndex);
  };

  const handleSwitchClick = (targetIndex) => {
    soundFx.playSwitch();
    setShowSwitchModal(false);
    onSelectSwitch(targetIndex);
  };

  return (
    <div style={{ marginTop: '1rem' }}>
      {/* If forced switch, show direct banner */}
      {isForcedSwitch && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid var(--accent-red)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginBottom: '1rem',
            textAlign: 'center'
          }}
        >
          <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent-red)', marginBottom: '0.25rem' }}>
            YOUR ACTIVE POKÉMON FAINTED!
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-sub)' }}>
            Select a healthy Pokémon from your bench to send out into battle.
          </p>
        </div>
      )}

      {/* Main Controls Grid */}
      <div className="battle-controls-container">
        {/* Left: 4 Move Buttons */}
        <div className="moves-grid">
          {moves.map((move, idx) => {
            const isOutOfPp = move.currentPp <= 0;
            const btnDisabled = disabled || isWaiting || isForcedSwitch || isOutOfPp;
            const typeColor = TYPE_COLORS[move.type?.toLowerCase()] || '#777';

            return (
              <button
                key={move.id + idx}
                className="move-btn"
                onClick={() => handleMoveClick(idx)}
                disabled={btnDisabled}
                style={{
                  borderLeft: `4px solid ${typeColor}`
                }}
              >
                <div className="move-btn-top">
                  <span className="move-btn-name">{move.name}</span>
                  <span
                    className="type-badge"
                    style={{ backgroundColor: typeColor, fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}
                  >
                    {move.type}
                  </span>
                </div>

                <div className="move-btn-bottom">
                  <span>
                    {move.category.toUpperCase()} | Pwr: {move.power || '-'} | Acc: {move.accuracy === 1000 ? '-' : move.accuracy + '%'}
                  </span>
                  <span style={{ fontWeight: 700, color: isOutOfPp ? 'var(--accent-red)' : 'var(--text-main)' }}>
                    PP {move.currentPp}/{move.maxPp}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: Actions Sidebar */}
        <div className="action-sidebar">
          <button
            className="btn-primary"
            onClick={() => setShowSwitchModal(true)}
            disabled={disabled || isWaiting}
            style={{
              background: isForcedSwitch
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
            }}
          >
            <ArrowLeftRight size={18} />
            {isForcedSwitch ? 'Choose Replacement' : 'Switch Pokémon'}
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button
              className="btn-secondary"
              onClick={() => setShowInfoModal(true)}
              disabled={disabled}
              style={{ fontSize: '0.85rem', padding: '0.6rem' }}
            >
              <Info size={16} /> Inspect
            </button>

            <button
              className="btn-danger"
              onClick={onForfeit}
              disabled={disabled || isWaiting}
              style={{ fontSize: '0.85rem', padding: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
            >
              <Flag size={16} /> Forfeit
            </button>
          </div>

          {isWaiting && (
            <div
              style={{
                textAlign: 'center',
                padding: '0.5rem',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--accent-gold)',
                fontSize: '0.8rem',
                fontFamily: 'var(--font-heading)'
              }}
            >
              Waiting for turn resolution...
            </div>
          )}
        </div>
      </div>

      {/* Switch Selection Modal */}
      {(showSwitchModal || isForcedSwitch) && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '550px',
              width: '100%',
              padding: '1.5rem',
              position: 'relative',
              boxShadow: 'var(--shadow-main)'
            }}
          >
            {!isForcedSwitch && (
              <button
                onClick={() => setShowSwitchModal(false)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            )}

            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: '#fff', marginBottom: '1rem' }}>
              {isForcedSwitch ? 'Select Replacement Pokémon' : 'Switch Active Pokémon'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {team.map((pk, idx) => {
                const isCurrent = idx === activeIndex;
                const isFainted = pk.currentHp <= 0 || pk.isFainted;
                const disabledSwitch = isCurrent || isFainted;

                const hpPercent = Math.round((pk.currentHp / pk.maxHp) * 100);

                return (
                  <button
                    key={pk.id + idx}
                    onClick={() => handleSwitchClick(idx)}
                    disabled={disabledSwitch}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      background: isCurrent ? 'rgba(59, 130, 246, 0.1)' : isFainted ? 'rgba(30, 36, 44, 0.4)' : 'var(--bg-surface)',
                      border: isCurrent ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      opacity: isFainted ? 0.45 : 1,
                      cursor: disabledSwitch ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img
                        src={pk.sprite || pk.artwork}
                        alt={pk.name}
                        style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                      />
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>
                          {pk.name} {isCurrent && <span style={{ color: 'var(--accent-blue)', fontSize: '0.8rem' }}>(Active)</span>}
                          {isFainted && <span style={{ color: 'var(--accent-red)', fontSize: '0.8rem' }}>(Fainted)</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.2rem' }}>
                          {pk.types.map(t => (
                            <span key={t} className="type-badge" style={{ backgroundColor: TYPE_COLORS[t.toLowerCase()] || '#777', fontSize: '0.6rem', padding: '0.05rem 0.3rem' }}>
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', minWidth: '90px' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: hpPercent > 50 ? 'var(--hp-green)' : hpPercent > 20 ? 'var(--hp-yellow)' : 'var(--hp-red)' }}>
                        {pk.currentHp} / {pk.maxHp} HP
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Item: {pk.item?.name || 'None'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Stat Stages Inspector Modal */}
      {showInfoModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setShowInfoModal(false)}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '480px',
              width: '100%',
              padding: '1.5rem',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowInfoModal(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>

            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: '#fff', marginBottom: '1rem' }}>
              {activePokemon?.name} — Battle Status
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem' }}>
              <div><strong>Ability:</strong> {activePokemon?.ability?.name} ({activePokemon?.ability?.description})</div>
              <div><strong>Held Item:</strong> {activePokemon?.item?.name} ({activePokemon?.item?.description})</div>
              <div style={{ marginTop: '0.5rem' }}>
                <strong>Stat Modifiers:</strong>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', marginTop: '0.4rem' }}>
                  {Object.entries(activePokemon?.statStages || {}).map(([st, stage]) => (
                    <div
                      key={st}
                      style={{
                        background: '#0d1117',
                        padding: '0.4rem',
                        borderRadius: 'var(--radius-sm)',
                        textAlign: 'center',
                        fontSize: '0.8rem',
                        color: stage > 0 ? '#34d399' : stage < 0 ? '#f87171' : 'var(--text-muted)'
                      }}
                    >
                      <div style={{ textTransform: 'capitalize' }}>{st}</div>
                      <div style={{ fontWeight: 700 }}>{stage > 0 ? `+${stage}` : stage}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
