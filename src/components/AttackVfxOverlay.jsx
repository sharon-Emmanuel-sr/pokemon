import React, { useEffect, useState } from 'react';
import { TYPE_COLORS } from '../data/typeChart.js';

export function AttackVfxOverlay({ currentEvent, onAnimationComplete }) {
  const [activeVfx, setActiveVfx] = useState(null);
  const [floatingText, setFloatingText] = useState(null);

  useEffect(() => {
    if (!currentEvent) {
      setActiveVfx(null);
      setFloatingText(null);
      return;
    }

    if (currentEvent.type === 'move_use') {
      const type = (currentEvent.moveType || 'normal').toLowerCase();
      const side = currentEvent.side || 'p1';

      setActiveVfx({
        moveName: currentEvent.moveName,
        moveType: type,
        side: side,
        color: TYPE_COLORS[type] || '#fff'
      });

      const timer = setTimeout(() => {
        setActiveVfx(null);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (currentEvent.type === 'damage' || currentEvent.type === 'super_effective' || currentEvent.type === 'crit' || currentEvent.type === 'miss' || currentEvent.type === 'immune') {
      const targetSide = currentEvent.targetSide || (currentEvent.side === 'p1' ? 'p2' : 'p1');
      let text = '';
      let color = '#fff';

      if (currentEvent.type === 'damage') {
        text = `-${currentEvent.damage} HP`;
        color = '#ef4444';
      } else if (currentEvent.type === 'super_effective') {
        text = 'SUPER EFFECTIVE!';
        color = '#10b981';
      } else if (currentEvent.type === 'crit') {
        text = 'CRITICAL HIT!';
        color = '#f59e0b';
      } else if (currentEvent.type === 'miss') {
        text = 'MISSED!';
        color = '#94a3b8';
      } else if (currentEvent.type === 'immune') {
        text = 'IMMUNE!';
        color = '#64748b';
      }

      setFloatingText({
        text,
        color,
        targetSide
      });

      const timer = setTimeout(() => {
        setFloatingText(null);
      }, 900);

      return () => clearTimeout(timer);
    }
  }, [currentEvent]);

  if (!activeVfx && !floatingText) return null;

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 30, overflow: 'hidden' }}>
      {/* Active Move Announcement Banner */}
      {activeVfx && (
        <div
          className="move-announcement-banner"
          style={{
            borderColor: activeVfx.color,
            boxShadow: `0 0 25px ${activeVfx.color}44`
          }}
        >
          <span
            className="type-badge"
            style={{ backgroundColor: activeVfx.color, fontSize: '0.75rem', padding: '0.15rem 0.5rem', marginRight: '0.5rem' }}
          >
            {activeVfx.moveType}
          </span>
          <span style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
            {activeVfx.moveName}
          </span>
        </div>
      )}

      {/* Visual Attack Particle Animations */}
      {activeVfx && (
        <div className={`vfx-layer vfx-${activeVfx.moveType} vfx-from-${activeVfx.side}`}>
          {/* Fire VFX */}
          {activeVfx.moveType === 'fire' && (
            <div className="vfx-fire-blast">
              <div className="fire-particle p1" />
              <div className="fire-particle p2" />
              <div className="fire-particle p3" />
              <div className="fire-core" />
            </div>
          )}

          {/* Water VFX */}
          {activeVfx.moveType === 'water' && (
            <div className="vfx-water-wave">
              <div className="water-surge" />
              <div className="water-splash s1" />
              <div className="water-splash s2" />
            </div>
          )}

          {/* Electric VFX */}
          {activeVfx.moveType === 'electric' && (
            <div className="vfx-electric-bolt">
              <div className="lightning-strike" />
              <div className="spark-burst" />
            </div>
          )}

          {/* Grass VFX */}
          {activeVfx.moveType === 'grass' && (
            <div className="vfx-grass-cyclone">
              <div className="razor-leaf l1" />
              <div className="razor-leaf l2" />
              <div className="razor-leaf l3" />
            </div>
          )}

          {/* Ice VFX */}
          {activeVfx.moveType === 'ice' && (
            <div className="vfx-ice-shards">
              <div className="frost-crystal c1" />
              <div className="frost-crystal c2" />
              <div className="blizzard-gust" />
            </div>
          )}

          {/* Fighting / Normal / Physical VFX */}
          {(activeVfx.moveType === 'fighting' || activeVfx.moveType === 'normal') && (
            <div className="vfx-impact-slash">
              <div className="slash-claw-1" />
              <div className="slash-claw-2" />
              <div className="shockwave-ring" />
            </div>
          )}

          {/* Psychic / Ghost / Dark VFX */}
          {(activeVfx.moveType === 'psychic' || activeVfx.moveType === 'ghost' || activeVfx.moveType === 'dark') && (
            <div className="vfx-shadow-sphere">
              <div className="dark-matter-orb" />
              <div className="distortion-ring" />
            </div>
          )}

          {/* Dragon / Fairy / Rock / Ground / Steel / Flying / Poison VFX fallback */}
          {!['fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'normal', 'psychic', 'ghost', 'dark'].includes(activeVfx.moveType) && (
            <div className="vfx-energy-beam" style={{ backgroundColor: activeVfx.color }}>
              <div className="beam-burst" />
              <div className="energy-ring" />
            </div>
          )}
        </div>
      )}

      {/* Floating Damage Numbers or Combat Alerts */}
      {floatingText && (
        <div
          className={`floating-combat-text text-target-${floatingText.targetSide}`}
          style={{ color: floatingText.color }}
        >
          {floatingText.text}
        </div>
      )}
    </div>
  );
}
