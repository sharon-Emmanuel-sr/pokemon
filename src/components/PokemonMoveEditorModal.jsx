import React, { useState, useMemo } from 'react';
import { MOVES, getMove } from '../data/moveData.js';
import { TYPES, TYPE_COLORS } from '../data/typeChart.js';
import { ITEM_LIST, getItem } from '../data/itemData.js';
import { getAbility } from '../data/abilityData.js';
import { X, Search, Check, Sparkles, Shield, Zap, Swords, Heart, RefreshCw } from 'lucide-react';
import { soundFx } from '../game/soundEffects.js';

export function PokemonMoveEditorModal({
  pokemon,
  onSave,
  onClose
}) {
  if (!pokemon) return null;

  // Selected 4 moves
  const initialMoves = Array.isArray(pokemon.moves)
    ? pokemon.moves.map(m => typeof m === 'string' ? m : m.id)
    : (pokemon.defaultMoves || ['tackle', 'protect', 'quickattack', 'bodyslam']);

  const [selectedMoves, setSelectedMoves] = useState([
    initialMoves[0] || 'tackle',
    initialMoves[1] || 'protect',
    initialMoves[2] || 'quickattack',
    initialMoves[3] || 'bodyslam'
  ]);

  const [activeSlot, setActiveSlot] = useState(0); // 0, 1, 2, 3
  const [selectedAbility, setSelectedAbility] = useState(
    pokemon.ability?.name || pokemon.ability?.id || pokemon.primaryAbility || (pokemon.abilities && pokemon.abilities[0]) || 'pressure'
  );
  const [selectedItem, setSelectedItem] = useState(pokemon.item?.id || pokemon.item || 'leftovers');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  const allMovesList = useMemo(() => {
    return Object.values(MOVES);
  }, []);

  const filteredMoves = useMemo(() => {
    return allMovesList.filter(m => {
      if (selectedTypeFilter !== 'all' && m.type.toLowerCase() !== selectedTypeFilter.toLowerCase()) return false;
      if (selectedCategoryFilter !== 'all' && m.category.toLowerCase() !== selectedCategoryFilter.toLowerCase()) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return m.name.toLowerCase().includes(q) || m.type.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [allMovesList, selectedTypeFilter, selectedCategoryFilter, searchQuery]);

  const handleSelectMove = (moveId) => {
    soundFx.playClick();
    const updated = [...selectedMoves];
    // If move already selected in another slot, swap or replace
    const existingIndex = updated.indexOf(moveId);
    if (existingIndex !== -1 && existingIndex !== activeSlot) {
      const temp = updated[activeSlot];
      updated[activeSlot] = moveId;
      updated[existingIndex] = temp;
    } else {
      updated[activeSlot] = moveId;
    }
    setSelectedMoves(updated);

    // Auto advance slot to next if available
    if (activeSlot < 3) {
      setActiveSlot(activeSlot + 1);
    }
  };

  const handleSave = () => {
    soundFx.playClick();
    onSave({
      moves: selectedMoves,
      ability: selectedAbility,
      item: selectedItem
    });
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 150,
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
          maxWidth: '900px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-main)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.2rem 1.5rem',
            background: 'rgba(13, 17, 23, 0.8)',
            borderBottom: '1px solid var(--border-color)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img
              src={pokemon.sprite || pokemon.artwork}
              alt={pokemon.name}
              style={{ width: '48px', height: '48px', objectFit: 'contain' }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: '#fff' }}>
                  Customize {pokemon.name}
                </h2>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  #{String(pokemon.num).padStart(3, '0')}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.2rem' }}>
                {pokemon.types.map(t => (
                  <span
                    key={t}
                    className="type-badge"
                    style={{ backgroundColor: TYPE_COLORS[t.toLowerCase()] || '#777', fontSize: '0.65rem', padding: '0.05rem 0.35rem' }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
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
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Top Section: 4 Active Move Slots */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--text-sub)', fontSize: '0.95rem' }}>
                ACTIVE BATTLE MOVESET (4 MOVES)
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-gold)' }}>
                Click a slot below, then click any move from the list to assign it!
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem' }}>
              {[0, 1, 2, 3].map((slotIdx) => {
                const moveId = selectedMoves[slotIdx];
                const moveObj = getMove(moveId);
                const isActive = activeSlot === slotIdx;
                const typeColor = TYPE_COLORS[moveObj.type?.toLowerCase()] || '#777';

                return (
                  <div
                    key={slotIdx}
                    onClick={() => setActiveSlot(slotIdx)}
                    style={{
                      background: isActive ? 'rgba(59, 130, 246, 0.2)' : 'var(--bg-surface)',
                      border: isActive ? '2px solid var(--accent-blue)' : '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem',
                      cursor: 'pointer',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '85px',
                      boxShadow: isActive ? '0 0 12px rgba(59, 130, 246, 0.35)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: isActive ? 'var(--accent-blue)' : 'var(--text-muted)' }}>
                        SLOT {slotIdx + 1}
                      </span>
                      <span
                        className="type-badge"
                        style={{ backgroundColor: typeColor, fontSize: '0.6rem', padding: '0.05rem 0.3rem' }}
                      >
                        {moveObj.type}
                      </span>
                    </div>

                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.95rem', color: '#fff', margin: '0.3rem 0' }}>
                      {moveObj.name}
                    </div>

                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{moveObj.category.toUpperCase()}</span>
                      <span>Pwr: {moveObj.power || '-'} | Acc: {moveObj.accuracy === 1000 ? '-' : moveObj.accuracy + '%'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Middle Section: Ability & Held Item Settings */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#0d1117', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            {/* Ability */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-sub)', fontWeight: 700, marginBottom: '0.35rem' }}>
                ABILITY
              </label>
              <select
                value={selectedAbility}
                onChange={(e) => setSelectedAbility(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-card)',
                  color: '#fff',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.5rem',
                  fontSize: '0.85rem'
                }}
              >
                {(pokemon.abilities || [pokemon.primaryAbility || 'Pressure']).map((ab) => {
                  const abObj = getAbility(ab);
                  return (
                    <option key={ab} value={ab}>
                      {abObj.name} — {abObj.description}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Held Item */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-sub)', fontWeight: 700, marginBottom: '0.35rem' }}>
                HELD ITEM
              </label>
              <select
                value={selectedItem}
                onChange={(e) => setSelectedItem(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-card)',
                  color: 'var(--accent-gold)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.5rem',
                  fontSize: '0.85rem',
                  fontWeight: 600
                }}
              >
                {ITEM_LIST.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.name} ({it.description})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Move Search & Pool Filter */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--text-sub)', fontSize: '0.95rem' }}>
                SELECT MOVE FOR SLOT {activeSlot + 1}
              </span>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {/* Search */}
                <div style={{ position: 'relative', width: '180px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '8px', top: '8px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search moves..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#0d1117',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.35rem 0.5rem 0.35rem 1.8rem',
                      color: '#fff',
                      fontSize: '0.8rem'
                    }}
                  />
                </div>

                {/* Type Filter */}
                <select
                  value={selectedTypeFilter}
                  onChange={(e) => setSelectedTypeFilter(e.target.value)}
                  style={{
                    background: '#0d1117',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.35rem 0.5rem',
                    fontSize: '0.8rem'
                  }}
                >
                  <option value="all">All Types</option>
                  {TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>

                {/* Category Filter */}
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  style={{
                    background: '#0d1117',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.35rem 0.5rem',
                    fontSize: '0.8rem'
                  }}
                >
                  <option value="all">All Categories</option>
                  <option value="physical">Physical</option>
                  <option value="special">Special</option>
                  <option value="status">Status</option>
                </select>
              </div>
            </div>

            {/* Available Moves Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '0.5rem',
                maxHeight: '260px',
                overflowY: 'auto',
                padding: '0.4rem',
                background: '#0d1117',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)'
              }}
            >
              {filteredMoves.map((move) => {
                const isAssigned = selectedMoves.includes(move.id);
                const isAssignedToActiveSlot = selectedMoves[activeSlot] === move.id;
                const typeColor = TYPE_COLORS[move.type?.toLowerCase()] || '#777';

                return (
                  <div
                    key={move.id}
                    onClick={() => handleSelectMove(move.id)}
                    style={{
                      background: isAssignedToActiveSlot
                        ? 'rgba(59, 130, 246, 0.25)'
                        : isAssigned
                        ? 'rgba(34, 197, 94, 0.12)'
                        : 'var(--bg-card)',
                      border: isAssignedToActiveSlot
                        ? '1px solid var(--accent-blue)'
                        : isAssigned
                        ? '1px solid rgba(34, 197, 94, 0.4)'
                        : '1px solid var(--border-color)',
                      borderLeft: `4px solid ${typeColor}`,
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.5rem 0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{move.name}</strong>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        {isAssigned && (
                          <span style={{ fontSize: '0.65rem', color: 'var(--hp-green)', fontWeight: 700 }}>
                            Slot {selectedMoves.indexOf(move.id) + 1}
                          </span>
                        )}
                        <span
                          className="type-badge"
                          style={{ backgroundColor: typeColor, fontSize: '0.6rem', padding: '0.05rem 0.3rem' }}
                        >
                          {move.type}
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.2rem 0' }}>
                      {move.category.toUpperCase()} | Pwr: {move.power || '-'} | Acc: {move.accuracy === 1000 ? '-' : move.accuracy + '%'} | PP: {move.pp}
                    </div>

                    <div style={{ fontSize: '0.7rem', color: 'var(--text-sub)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {move.description}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            background: 'rgba(13, 17, 23, 0.95)',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem'
          }}
        >
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '0.6rem 1.2rem' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn-primary"
            style={{ padding: '0.6rem 1.5rem' }}
          >
            <Check size={18} /> Confirm & Save Moveset
          </button>
        </div>
      </div>
    </div>
  );
}
