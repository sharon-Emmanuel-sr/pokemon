import React, { useState, useMemo } from 'react';
import { POKEMON_LIST, filterPokemon } from '../data/pokemonData.js';
import { TYPES, TYPE_COLORS } from '../data/typeChart.js';
import { ITEM_LIST, getItem } from '../data/itemData.js';
import { getMove } from '../data/moveData.js';
import { PokemonCard } from './PokemonCard.jsx';
import { PokemonDetailModal } from './PokemonDetailModal.jsx';
import { PokemonMoveEditorModal } from './PokemonMoveEditorModal.jsx';
import { Search, Shuffle, Play, ArrowLeft, ArrowUp, ArrowDown, Trash2, SlidersHorizontal, ShieldAlert, Sparkles, Settings2 } from 'lucide-react';
import { soundFx } from '../game/soundEffects.js';

export function TeamBuilder({
  teamSize = 3,
  onTeamSizeChange = null,
  onStartBattle,
  onBackToLobby,
  isMultiplayer = false,
  opponentReady = false
}) {
  const [selectedTeam, setSelectedTeam] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGen, setSelectedGen] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('num');

  // Modals
  const [inspectPokemon, setInspectPokemon] = useState(null);
  const [editingIndex, setEditingIndex] = useState(-1);

  // Filter and sort Pokemon list
  const filteredList = useMemo(() => {
    let list = POKEMON_LIST.filter(p => {
      if (selectedGen !== 'all' && p.generation !== Number(selectedGen)) return false;
      if (selectedType !== 'all' && !p.types.includes(selectedType.toLowerCase())) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const numMatch = String(p.num) === q || String(p.num).padStart(3, '0') === q;
        const nameMatch = p.name.toLowerCase().includes(q);
        return numMatch || nameMatch;
      }
      return true;
    });

    return list.sort((a, b) => {
      if (sortBy === 'num') return a.num - b.num;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'bst') return b.baseStats.total - a.baseStats.total;
      if (sortBy === 'speed') return b.baseStats.speed - a.baseStats.speed;
      if (sortBy === 'attack') return b.baseStats.attack - a.baseStats.attack;
      return a.num - b.num;
    });
  }, [searchQuery, selectedGen, selectedType, sortBy]);

  const isTeamFull = selectedTeam.length === teamSize;

  const handleAddPokemon = (pokemon) => {
    if (selectedTeam.length >= teamSize) return;
    if (selectedTeam.some(p => p.num === pokemon.num)) return; // Prevent duplicate species

    soundFx.playClick();
    const newMember = {
      ...pokemon,
      level: 50,
      item: 'leftovers',
      ability: pokemon.primaryAbility || (pokemon.abilities && pokemon.abilities[0]) || 'Pressure',
      moves: [...(pokemon.defaultMoves || ['tackle', 'protect', 'quickattack', 'bodyslam'])]
    };

    setSelectedTeam([...selectedTeam, newMember]);
  };

  const handleRemovePokemon = (indexOrPokemon) => {
    soundFx.playClick();
    if (typeof indexOrPokemon === 'number') {
      setSelectedTeam(selectedTeam.filter((_, idx) => idx !== indexOrPokemon));
    } else {
      setSelectedTeam(selectedTeam.filter(p => p.num !== indexOrPokemon.num));
    }
  };

  const handleMoveUp = (index) => {
    if (index <= 0) return;
    const updated = [...selectedTeam];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    setSelectedTeam(updated);
  };

  const handleMoveDown = (index) => {
    if (index >= selectedTeam.length - 1) return;
    const updated = [...selectedTeam];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    setSelectedTeam(updated);
  };

  const handleSaveCustomization = (customData) => {
    if (editingIndex < 0 || editingIndex >= selectedTeam.length) return;
    const updated = [...selectedTeam];
    updated[editingIndex] = {
      ...updated[editingIndex],
      moves: customData.moves,
      ability: customData.ability,
      item: customData.item
    };
    setSelectedTeam(updated);
    setEditingIndex(-1);
  };

  const handleRandomTeam = () => {
    soundFx.playClick();
    const shuffled = [...POKEMON_LIST].sort(() => 0.5 - Math.random());
    const randomItems = ['leftovers', 'lifeorb', 'choiceband', 'choicespecs', 'choicescarf', 'focussash', 'sitrusberry', 'lumBerry', 'assaultvest', 'expertbelt'];

    const randomTeam = shuffled.slice(0, teamSize).map(pk => ({
      ...pk,
      level: 50,
      item: randomItems[Math.floor(Math.random() * randomItems.length)],
      ability: pk.primaryAbility || (pk.abilities && pk.abilities[0]) || 'Pressure',
      moves: [...(pk.defaultMoves || ['tackle', 'protect', 'quickattack', 'bodyslam'])]
    }));

    setSelectedTeam(randomTeam);
  };

  const handleSizeChange = (newSize) => {
    if (onTeamSizeChange) {
      onTeamSizeChange(newSize);
    }
    if (selectedTeam.length > newSize) {
      setSelectedTeam(selectedTeam.slice(0, newSize));
    }
  };

  return (
    <div style={{ maxWidth: '1300px', margin: '1rem auto', padding: '0 1rem' }}>
      {/* Top Header Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.25rem',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '1rem 1.5rem'
        }}
      >
        <button
          onClick={onBackToLobby}
          className="btn-secondary"
          style={{ padding: '0.6rem 1rem' }}
        >
          <ArrowLeft size={18} /> Back to Lobby
        </button>

        {/* Team Size Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--text-sub)' }}>
            TEAM SIZE:
          </span>
          <div style={{ display: 'flex', background: '#0d1117', padding: '4px', borderRadius: 'var(--radius-md)' }}>
            <button
              onClick={() => handleSizeChange(3)}
              disabled={isMultiplayer && !onTeamSizeChange}
              style={{
                padding: '0.4rem 1rem',
                borderRadius: 'var(--radius-sm)',
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: '0.9rem',
                background: teamSize === 3 ? 'var(--accent-blue)' : 'transparent',
                color: teamSize === 3 ? '#fff' : 'var(--text-muted)'
              }}
            >
              3 Pokémon
            </button>
            <button
              onClick={() => handleSizeChange(6)}
              disabled={isMultiplayer && !onTeamSizeChange}
              style={{
                padding: '0.4rem 1rem',
                borderRadius: 'var(--radius-sm)',
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: '0.9rem',
                background: teamSize === 6 ? 'var(--accent-blue)' : 'transparent',
                color: teamSize === 6 ? '#fff' : 'var(--text-muted)'
              }}
            >
              6 Pokémon
            </button>
          </div>
        </div>

        {/* Quick Autofill & Start Action */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={handleRandomTeam}
            className="btn-secondary"
            style={{ padding: '0.6rem 1rem', background: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)', color: 'var(--accent-gold)' }}
          >
            <Shuffle size={18} /> Random Team
          </button>

          <button
            onClick={() => onStartBattle(selectedTeam)}
            disabled={!isTeamFull}
            className="btn-primary"
            style={{
              padding: '0.6rem 1.5rem',
              opacity: isTeamFull ? 1 : 0.45,
              cursor: isTeamFull ? 'pointer' : 'not-allowed'
            }}
          >
            <Play size={18} />
            {isMultiplayer ? (isTeamFull ? 'Lock In & Ready' : `Select ${teamSize} Pokémon`) : 'Start Battle'}
          </button>
        </div>
      </div>

      {/* Selected Team Dock */}
      <div
        style={{
          background: 'rgba(22, 27, 34, 0.95)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          boxShadow: 'var(--shadow-main)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: '#fff' }}>
              Your Selected Team
            </h2>
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '0.9rem',
                fontWeight: 700,
                padding: '0.2rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                background: isTeamFull ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                color: isTeamFull ? 'var(--hp-green)' : 'var(--accent-gold)',
                border: `1px solid ${isTeamFull ? 'rgba(34, 197, 94, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`
              }}
            >
              Team: {selectedTeam.length} / {teamSize}
            </span>
          </div>

          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Click <strong>"Edit Moves"</strong> on any slot to choose custom moves and abilities!
          </span>
        </div>

        {/* Selected Slots Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${teamSize}, 1fr)`,
            gap: '0.75rem',
            minHeight: '160px'
          }}
        >
          {Array.from({ length: teamSize }).map((_, idx) => {
            const member = selectedTeam[idx];
            if (!member) {
              return (
                <div
                  key={`empty-${idx}`}
                  style={{
                    border: '2px dashed #30363d',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                    padding: '1rem',
                    background: 'rgba(13, 17, 23, 0.5)'
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, opacity: 0.5 }}>
                    Slot #{idx + 1}
                  </span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '0.25rem' }}>
                    Choose a Pokémon below
                  </span>
                </div>
              );
            }

            const item = getItem(member.item);
            const movesList = member.moves || member.defaultMoves || [];

            return (
              <div
                key={member.id + idx}
                style={{
                  background: idx === 0 ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-surface)',
                  border: idx === 0 ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative'
                }}
              >
                {idx === 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '6px',
                      left: '6px',
                      fontSize: '0.65rem',
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 800,
                      background: 'var(--accent-blue)',
                      color: '#fff',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px'
                    }}
                  >
                    LEAD
                  </span>
                )}

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: idx === 0 ? '0.6rem' : '0' }}>
                    <img
                      src={member.sprite || member.artwork}
                      alt={member.name}
                      style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.95rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {member.name}
                      </div>
                      <div style={{ display: 'flex', gap: '0.2rem', marginTop: '0.2rem' }}>
                        {member.types.map(t => (
                          <span
                            key={t}
                            className="type-badge"
                            style={{
                              backgroundColor: TYPE_COLORS[t.toLowerCase()] || '#777',
                              fontSize: '0.6rem',
                              padding: '0.05rem 0.35rem'
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Moves Preview */}
                  <div style={{ marginTop: '0.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem' }}>
                    {movesList.slice(0, 4).map((m, mIdx) => {
                      const mObj = getMove(typeof m === 'string' ? m : m.id);
                      return (
                        <div
                          key={mIdx}
                          style={{
                            background: '#0d1117',
                            padding: '0.2rem 0.4rem',
                            borderRadius: '3px',
                            fontSize: '0.68rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            color: TYPE_COLORS[mObj.type?.toLowerCase()] || '#fff'
                          }}
                          title={mObj.name}
                        >
                          • {mObj.name}
                        </div>
                      );
                    })}
                  </div>

                  {/* Held Item & Ability display */}
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                    Item: <strong style={{ color: 'var(--accent-gold)' }}>{item.name}</strong>
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div style={{ marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {/* Customize Moves Button */}
                  <button
                    onClick={() => setEditingIndex(idx)}
                    style={{
                      width: '100%',
                      background: 'rgba(59, 130, 246, 0.2)',
                      border: '1px solid rgba(59, 130, 246, 0.4)',
                      color: 'var(--accent-blue)',
                      padding: '0.35rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <Settings2 size={13} /> Edit Moves & Item
                  </button>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button
                        onClick={() => handleMoveUp(idx)}
                        disabled={idx === 0}
                        title="Move Left/Up"
                        style={{
                          background: '#0d1117',
                          color: idx === 0 ? '#4b5563' : '#fff',
                          padding: '3px 6px',
                          borderRadius: '3px',
                          fontSize: '0.7rem'
                        }}
                      >
                        <ArrowLeft size={12} />
                      </button>
                      <button
                        onClick={() => handleMoveDown(idx)}
                        disabled={idx === selectedTeam.length - 1}
                        title="Move Right/Down"
                        style={{
                          background: '#0d1117',
                          color: idx === selectedTeam.length - 1 ? '#4b5563' : '#fff',
                          padding: '3px 6px',
                          borderRadius: '3px',
                          fontSize: '0.7rem'
                        }}
                      >
                        <ArrowDown size={12} />
                      </button>
                    </div>

                    <button
                      onClick={() => handleRemovePokemon(idx)}
                      title="Remove from Team"
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        color: 'var(--accent-red)',
                        padding: '3px 6px',
                        borderRadius: '3px'
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center'
        }}
      >
        {/* Search input */}
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by Pokémon name or Pokédex #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: '#0d1117',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '0.6rem 0.6rem 0.6rem 2.2rem',
              color: '#fff',
              fontSize: '0.9rem'
            }}
          />
        </div>

        {/* Generation Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Gen:</span>
          <select
            value={selectedGen}
            onChange={(e) => setSelectedGen(e.target.value)}
            style={{
              background: '#0d1117',
              border: '1px solid var(--border-color)',
              color: '#fff',
              padding: '0.5rem 0.8rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem'
            }}
          >
            <option value="all">All Gens (1–8)</option>
            <option value="1">Gen 1 (#001–#151 Kanto)</option>
            <option value="2">Gen 2 (#152–#251 Johto)</option>
            <option value="3">Gen 3 (#252–#386 Hoenn)</option>
            <option value="4">Gen 4 (#387–#493 Sinnoh)</option>
            <option value="5">Gen 5 (#494–#649 Unova)</option>
            <option value="6">Gen 6 (#650–#721 Kalos)</option>
            <option value="7">Gen 7 (#722–#809 Alola)</option>
            <option value="8">Gen 8 (#810–#898 Galar)</option>
          </select>
        </div>

        {/* Type Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Type:</span>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            style={{
              background: '#0d1117',
              border: '1px solid var(--border-color)',
              color: '#fff',
              padding: '0.5rem 0.8rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              textTransform: 'capitalize'
            }}
          >
            <option value="all">All Types</option>
            {TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              background: '#0d1117',
              border: '1px solid var(--border-color)',
              color: '#fff',
              padding: '0.5rem 0.8rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem'
            }}
          >
            <option value="num">Pokédex #</option>
            <option value="name">Name (A-Z)</option>
            <option value="bst">Base Stat Total (High to Low)</option>
            <option value="speed">Speed (Fastest)</option>
            <option value="attack">Attack (Highest)</option>
          </select>
        </div>
      </div>

      {/* Roster Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '0.85rem',
          maxHeight: '60vh',
          overflowY: 'auto',
          padding: '0.5rem',
          background: 'rgba(13, 17, 23, 0.4)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)'
        }}
      >
        {filteredList.slice(0, 200).map((pk) => {
          const isSelected = selectedTeam.some(p => p.num === pk.num);
          return (
            <PokemonCard
              key={pk.num}
              pokemon={pk}
              isSelected={isSelected}
              onSelect={handleAddPokemon}
              onRemove={handleRemovePokemon}
              onInspect={(p) => setInspectPokemon(p)}
              disabled={isTeamFull}
            />
          );
        })}
      </div>

      {filteredList.length > 200 && (
        <div style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Showing top 200 matches. Use search or filters to narrow down the {filteredList.length} Pokémon roster.
        </div>
      )}

      {/* Inspect Modal */}
      {inspectPokemon && (
        <PokemonDetailModal
          pokemon={inspectPokemon}
          onClose={() => setInspectPokemon(null)}
        />
      )}

      {/* Move & Build Editor Modal */}
      {editingIndex >= 0 && selectedTeam[editingIndex] && (
        <PokemonMoveEditorModal
          pokemon={selectedTeam[editingIndex]}
          onSave={handleSaveCustomization}
          onClose={() => setEditingIndex(-1)}
        />
      )}
    </div>
  );
}
