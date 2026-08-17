import React from 'react';
import { TYPE_COLORS } from '../data/typeChart.js';
import { Plus, Check, Info, Trash2 } from 'lucide-react';

export function PokemonCard({
  pokemon,
  isSelected,
  onSelect,
  onRemove,
  onInspect,
  disabled = false
}) {
  const { num, name, types, baseStats, sprite, artwork, animatedFront } = pokemon;

  return (
    <div
      style={{
        background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-card)',
        border: isSelected ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '0.85rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        transition: 'all 0.2s ease',
        boxShadow: isSelected ? '0 0 16px rgba(59, 130, 246, 0.25)' : 'none'
      }}
    >
      {/* Pokédex Number Badge */}
      <span
        style={{
          position: 'absolute',
          top: '8px',
          left: '8px',
          fontFamily: 'var(--font-heading)',
          fontSize: '0.75rem',
          fontWeight: 700,
          color: 'var(--text-muted)'
        }}
      >
        #{String(num).padStart(3, '0')}
      </span>

      {/* Inspect Button */}
      <button
        onClick={() => onInspect(pokemon)}
        title="View Details"
        style={{
          position: 'absolute',
          top: '6px',
          right: '6px',
          background: 'transparent',
          color: 'var(--text-muted)',
          padding: '4px',
          borderRadius: '4px'
        }}
      >
        <Info size={16} />
      </button>

      {/* Sprite */}
      <div
        style={{
          width: '84px',
          height: '84px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0.5rem 0'
        }}
      >
        <img
          src={sprite || artwork}
          alt={name}
          loading="lazy"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))'
          }}
          onError={(e) => {
            if (e.target.src !== sprite) {
              e.target.src = sprite;
            }
          }}
        />
      </div>

      {/* Name */}
      <div
        style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          fontSize: '1rem',
          color: '#fff',
          textAlign: 'center',
          marginBottom: '0.35rem',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          width: '100%'
        }}
      >
        {name}
      </div>

      {/* Type Badges */}
      <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.6rem' }}>
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

      {/* Base Stat Total */}
      <div
        style={{
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          marginBottom: '0.6rem'
        }}
      >
        BST: <strong style={{ color: 'var(--text-sub)' }}>{baseStats.total}</strong> | Spe: <strong style={{ color: 'var(--text-sub)' }}>{baseStats.speed}</strong>
      </div>

      {/* Action Button */}
      {isSelected ? (
        <button
          onClick={() => onRemove(pokemon)}
          style={{
            width: '100%',
            padding: '0.4rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: 'var(--accent-red)',
            fontSize: '0.8rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.3rem'
          }}
        >
          <Trash2 size={14} /> Remove
        </button>
      ) : (
        <button
          onClick={() => onSelect(pokemon)}
          disabled={disabled}
          style={{
            width: '100%',
            padding: '0.4rem',
            borderRadius: 'var(--radius-sm)',
            background: disabled ? '#21262d' : 'rgba(59, 130, 246, 0.2)',
            border: disabled ? '1px solid #30363d' : '1px solid rgba(59, 130, 246, 0.4)',
            color: disabled ? '#6e7681' : 'var(--accent-blue)',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.3rem'
          }}
        >
          <Plus size={14} /> Add to Team
        </button>
      )}
    </div>
  );
}
