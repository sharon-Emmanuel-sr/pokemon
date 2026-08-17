import React, { useEffect, useState } from 'react';
import { TYPE_COLORS } from '../data/typeChart.js';
import { soundFx } from '../game/soundEffects.js';
import { AttackVfxOverlay } from './AttackVfxOverlay.jsx';
import { Sun, CloudRain, Wind, Snowflake, Zap } from 'lucide-react';

export function BattleArena({
  p1Active,
  p2Active,
  p1Team = [],
  p2Team = [],
  p1Name = 'Player',
  p2Name = 'Opponent',
  weather = 'none',
  lastEvent = null
}) {
  const [p1Anim, setP1Anim] = useState('');
  const [p2Anim, setP2Anim] = useState('');

  useEffect(() => {
    if (!lastEvent) return;

    if (lastEvent.type === 'move_use') {
      if (lastEvent.side === 'p1') {
        setP1Anim('anim-attack-p1');
        setTimeout(() => setP1Anim(''), 400);
      } else {
        setP2Anim('anim-attack-p2');
        setTimeout(() => setP2Anim(''), 400);
      }
    } else if (lastEvent.type === 'damage' || lastEvent.type === 'super_effective' || lastEvent.type === 'crit') {
      if (lastEvent.targetSide === 'p1') {
        setP1Anim('anim-shake');
        setTimeout(() => setP1Anim(''), 500);
      } else {
        setP2Anim('anim-shake');
        setTimeout(() => setP2Anim(''), 500);
      }

      if (lastEvent.type === 'super_effective') soundFx.playSuperEffective();
      else if (lastEvent.type === 'crit') soundFx.playCrit();
      else soundFx.playHit();
    } else if (lastEvent.type === 'faint') {
      soundFx.playFaint();
    }
  }, [lastEvent]);

  if (!p1Active || !p2Active) return null;

  const p1HpPercent = Math.max(0, Math.min(100, Math.round((p1Active.currentHp / p1Active.maxHp) * 100)));
  const p2HpPercent = Math.max(0, Math.min(100, Math.round((p2Active.currentHp / p2Active.maxHp) * 100)));

  const getHpColorClass = (percent) => {
    if (percent > 50) return 'hp-green';
    if (percent > 20) return 'hp-yellow';
    return 'hp-red';
  };

  return (
    <div className="arena-stage">
      {/* Attack Visual Effects & Floating Damage Overlay */}
      <AttackVfxOverlay currentEvent={lastEvent} />

      {/* Weather Indicator */}
      {weather !== 'none' && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 'var(--radius-full)',
            padding: '0.35rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.8rem',
            fontFamily: 'var(--font-heading)',
            color: '#fff',
            zIndex: 20
          }}
        >
          {weather === 'sun' && <Sun size={16} color="#f59e0b" />}
          {weather === 'rain' && <CloudRain size={16} color="#3b82f6" />}
          {weather === 'sand' && <Wind size={16} color="#d97706" />}
          {weather === 'hail' && <Snowflake size={16} color="#06b6d4" />}
          <span style={{ textTransform: 'uppercase' }}>{weather} Active</span>
        </div>
      )}

      {/* Stage Visual Grounds */}
      <div className="stage-ground-opp" />
      <div className="stage-ground-player" />

      {/* TOP ROW: Opponent Active HUD & Sprite */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 10 }}>
        {/* Opponent Info Box */}
        <div className="pokemon-hud" style={{ marginLeft: '1rem' }}>
          <div className="hud-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="hud-name">{p2Active.name}</span>
              {p2Active.status && (
                <span className={`status-badge status-${p2Active.status}`}>
                  {p2Active.status.slice(0, 3)}
                </span>
              )}
            </div>
            <span className="hud-level">Lv. {p2Active.level || 50}</span>
          </div>

          {/* Types */}
          <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.4rem' }}>
            {p2Active.types.map(t => (
              <span key={t} className="type-badge" style={{ backgroundColor: TYPE_COLORS[t.toLowerCase()] || '#777', fontSize: '0.6rem', padding: '0.05rem 0.35rem' }}>
                {t}
              </span>
            ))}
          </div>

          {/* HP Bar */}
          <div className="hp-bar-container">
            <div
              className={`hp-bar-fill ${getHpColorClass(p2HpPercent)}`}
              style={{ width: `${p2HpPercent}%` }}
            />
          </div>

          <div className="hud-footer">
            <span style={{ fontWeight: 600 }}>{p2Name}</span>
            <div className="team-pokeballs">
              {p2Team.map((pk, idx) => (
                <div
                  key={`p2-pk-${idx}`}
                  className={`pokeball-dot ${pk.currentHp <= 0 || pk.isFainted ? 'fainted' : ''}`}
                  title={pk.name}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Opponent Sprite */}
        <img
          src={p2Active.animatedFront || p2Active.sprite || p2Active.artwork}
          alt={p2Active.name}
          className={`sprite-opponent ${p2Anim} ${p2Active.currentHp <= 0 ? 'anim-faint' : ''}`}
          onError={(e) => {
            if (e.target.src !== p2Active.sprite) {
              e.target.src = p2Active.sprite || p2Active.artwork;
            }
          }}
        />
      </div>

      {/* BOTTOM ROW: Player Active Sprite & Player Active HUD */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', zIndex: 10 }}>
        {/* Player Sprite */}
        <img
          src={p1Active.animatedBack || p1Active.animatedFront || p1Active.sprite || p1Active.artwork}
          alt={p1Active.name}
          className={`sprite-player ${p1Anim} ${p1Active.currentHp <= 0 ? 'anim-faint' : ''}`}
          onError={(e) => {
            if (e.target.src !== p1Active.sprite) {
              e.target.src = p1Active.sprite || p1Active.artwork;
            }
          }}
        />

        {/* Player Info Box */}
        <div className="pokemon-hud" style={{ marginRight: '1rem' }}>
          <div className="hud-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="hud-name">{p1Active.name}</span>
              {p1Active.status && (
                <span className={`status-badge status-${p1Active.status}`}>
                  {p1Active.status.slice(0, 3)}
                </span>
              )}
            </div>
            <span className="hud-level">Lv. {p1Active.level || 50}</span>
          </div>

          {/* Types & Held Item */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {p1Active.types.map(t => (
                <span key={t} className="type-badge" style={{ backgroundColor: TYPE_COLORS[t.toLowerCase()] || '#777', fontSize: '0.6rem', padding: '0.05rem 0.35rem' }}>
                  {t}
                </span>
              ))}
            </div>
            {p1Active.item && p1Active.item.id !== 'none' && (
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)' }}>
                {p1Active.item.name}
              </span>
            )}
          </div>

          {/* HP Bar */}
          <div className="hp-bar-container">
            <div
              className={`hp-bar-fill ${getHpColorClass(p1HpPercent)}`}
              style={{ width: `${p1HpPercent}%` }}
            />
          </div>

          <div className="hud-footer">
            <div className="team-pokeballs">
              {p1Team.map((pk, idx) => (
                <div
                  key={`p1-pk-${idx}`}
                  className={`pokeball-dot ${pk.currentHp <= 0 || pk.isFainted ? 'fainted' : ''}`}
                  title={pk.name}
                />
              ))}
            </div>
            <span style={{ fontWeight: 700, color: '#fff' }}>
              {p1Active.currentHp} / {p1Active.maxHp} HP ({p1HpPercent}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
