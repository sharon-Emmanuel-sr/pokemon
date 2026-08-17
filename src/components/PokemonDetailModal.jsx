import React from 'react';
import { TYPE_COLORS } from '../data/typeChart.js';
import { getMove } from '../data/moveData.js';
import { getAbility } from '../data/abilityData.js';
import { ITEM_LIST } from '../data/itemData.js';
import { X, Shield, Zap, Sparkles, Heart, Crosshair } from 'lucide-react';

export function PokemonDetailModal({
  pokemon,
  onClose,
  selectedItem = 'leftovers',
  onItemChange = null
}) {
  if (!pokemon) return null;

  const { num, name, types, baseStats, abilities, defaultMoves, heightm, weightkg, generation, artwork, sprite } = pokemon;

  const statsList = [
    { key: 'hp', label: 'HP', val: baseStats.hp, color: '#22c55e' },
    { key: 'attack', label: 'Attack', val: baseStats.attack, color: '#ef4444' },
    { key: 'defense', label: 'Defense', val: baseStats.defense, color: '#3b82f6' },
    { key: 'specialAttack', label: 'Sp. Atk', val: baseStats.specialAttack, color: '#f59e0b' },
    { key: 'specialDefense', label: 'Sp. Def', val: baseStats.specialDefense, color: '#8b5cf6' },
    { key: 'speed', label: 'Speed', val: baseStats.speed, color: '#06b6d4' }
  ];

  const maxStatVal = 200;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          maxWidth: '650px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '1.5rem',
          position: 'relative',
          boxShadow: 'var(--shadow-main)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
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

        {/* Top Header */}
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '130px',
              height: '130px',
              background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <img
              src={artwork || sprite}
              alt={name}
              style={{
                maxWidth: '120px',
                maxHeight: '120px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.5))'
              }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
                #{String(num).padStart(3, '0')}
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '0.1rem 0.4rem',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: 'var(--accent-gold)',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-heading)'
                }}
              >
                GEN {generation}
              </span>
            </div>

            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', color: '#fff', marginBottom: '0.4rem' }}>
              {name}
            </h2>

            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
              {types.map((t) => (
                <span
                  key={t}
                  className="type-badge"
                  style={{ backgroundColor: TYPE_COLORS[t.toLowerCase()] || '#777' }}
                >
                  {t}
                </span>
              ))}
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Height: {heightm}m | Weight: {weightkg}kg | Base Stat Total: <strong style={{ color: '#fff' }}>{baseStats.total}</strong>
            </div>
          </div>
        </div>

        {/* Base Stats Breakdown */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'var(--text-sub)', marginBottom: '0.75rem' }}>
            Base Stats
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {statsList.map((st) => (
              <div key={st.key} style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem' }}>
                <span style={{ width: '85px', color: 'var(--text-muted)', fontWeight: 600 }}>{st.label}</span>
                <span style={{ width: '40px', fontWeight: 700, color: '#fff', textAlign: 'right', marginRight: '0.75rem' }}>
                  {st.val}
                </span>
                <div style={{ flex: 1, height: '8px', background: '#21262d', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, (st.val / maxStatVal) * 100)}%`,
                      backgroundColor: st.color,
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Abilities */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'var(--text-sub)', marginBottom: '0.5rem' }}>
            Abilities
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {abilities.map((ab) => {
              const abObj = getAbility(ab);
              return (
                <div
                  key={ab}
                  style={{
                    background: '#21262d',
                    border: '1px solid var(--border-color)',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem'
                  }}
                >
                  <strong style={{ color: 'var(--accent-gold)' }}>{abObj.name}:</strong>{' '}
                  <span style={{ color: 'var(--text-sub)' }}>{abObj.description}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Default Battle Moves (4 moves) */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'var(--text-sub)', marginBottom: '0.5rem' }}>
            Battle Moveset (4 Usable Moves)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            {(defaultMoves || []).map((mId) => {
              const move = getMove(mId);
              return (
                <div
                  key={mId}
                  style={{
                    background: '#1c2128',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.5rem 0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                    <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{move.name}</strong>
                    <span
                      className="type-badge"
                      style={{
                        backgroundColor: TYPE_COLORS[move.type.toLowerCase()] || '#777',
                        fontSize: '0.65rem',
                        padding: '0.1rem 0.35rem'
                      }}
                    >
                      {move.type}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {move.category.toUpperCase()} | Pwr: {move.power || '-'} | Acc: {move.accuracy === 1000 ? '-' : move.accuracy + '%'} | PP: {move.pp}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Held Item Selector (if editing) */}
        {onItemChange && (
          <div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'var(--text-sub)', marginBottom: '0.5rem' }}>
              Held Item
            </h3>
            <select
              value={selectedItem}
              onChange={(e) => onItemChange(e.target.value)}
              style={{
                width: '100%',
                background: '#21262d',
                color: '#fff',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.6rem',
                fontSize: '0.9rem'
              }}
            >
              {ITEM_LIST.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.name} — {it.description}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
