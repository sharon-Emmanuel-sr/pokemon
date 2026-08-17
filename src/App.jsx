import React, { useState, useEffect, useRef } from 'react';
import { POKEMON_LIST } from './data/pokemonData.js';
import { BattleEngine } from './game/BattleEngine.js';
import { AIEngine } from './game/AIEngine.js';
import { soundFx } from './game/soundEffects.js';
import { NetworkClient } from './multiplayer/NetworkClient.js';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { TeamBuilder } from './components/TeamBuilder.jsx';
import { BattleArena } from './components/BattleArena.jsx';
import { BattleControls } from './components/BattleControls.jsx';
import { BattleLog } from './components/BattleLog.jsx';
import { VictoryDefeatModal } from './components/VictoryDefeatModal.jsx';
import { MultiplayerLobby } from './components/MultiplayerLobby.jsx';
import { Swords, Bot, Users, Sparkles, Volume2, VolumeX, Shield, Play } from 'lucide-react';

export function App() {
  // Navigation State: 'main_menu' | 'ai_team_builder' | 'multiplayer_lobby' | 'multiplayer_team_builder' | 'battle'
  const [screen, setScreen] = useState('main_menu');

  // Battle Mode: 'ai' | 'multiplayer'
  const [battleMode, setBattleMode] = useState('ai');
  const [teamSize, setTeamSize] = useState(3);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Battle State
  const [battleState, setBattleState] = useState(null);
  const [isWaitingAction, setIsWaitingAction] = useState(false);
  const [playerSide, setPlayerSide] = useState('p1');
  const [lastBattleEvent, setLastBattleEvent] = useState(null);

  // Local AI Battle Engine Reference
  const localEngineRef = useRef(null);
  const playerTeamCacheRef = useRef([]);

  // Multiplayer State
  const networkClientRef = useRef(null);
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [roomCode, setRoomCode] = useState(null);
  const [mpPlayerId, setMpPlayerId] = useState('p1');
  const [opponentName, setOpponentName] = useState('');
  const [p1Ready, setP1Ready] = useState(false);
  const [p2Ready, setP2Ready] = useState(false);
  const [disconnectNotice, setDisconnectNotice] = useState(null);

  // Helper to step through turn animation events smoothly
  const playTurnAnimationSequence = (turnLogs, finalState) => {
    setIsWaitingAction(true);
    const visualEvents = (turnLogs || []).filter(e =>
      ['move_use', 'damage', 'super_effective', 'crit', 'miss', 'immune', 'switch', 'faint'].includes(e.type)
    );

    if (visualEvents.length === 0) {
      setBattleState({ ...finalState });
      setIsWaitingAction(false);
      return;
    }

    visualEvents.forEach((evt, idx) => {
      setTimeout(() => {
        setLastBattleEvent({ ...evt });
        if (idx === visualEvents.length - 1) {
          setTimeout(() => {
            setBattleState({ ...finalState });
            setIsWaitingAction(false);
          }, 600);
        }
      }, idx * 700);
    });
  };

  // Initialize NetworkClient
  useEffect(() => {
    const client = new NetworkClient();
    networkClientRef.current = client;

    client.on('connected', () => setIsWsConnected(true));
    client.on('disconnected', () => setIsWsConnected(false));

    client.on('room_created', (data) => {
      setRoomCode(data.roomCode);
      setMpPlayerId('p1');
      setPlayerSide('p1');
      setTeamSize(data.teamSize || 3);
    });

    client.on('room_joined', (data) => {
      setRoomCode(data.roomCode);
      setMpPlayerId('p2');
      setPlayerSide('p2');
      setTeamSize(data.teamSize || 3);
      setOpponentName(data.opponentName || 'Player 1');
    });

    client.on('opponent_joined', (data) => {
      setOpponentName(data.opponentName || 'Player 2');
      if (data.teamSize) setTeamSize(data.teamSize);
    });

    client.on('team_size_updated', (data) => {
      setTeamSize(data.teamSize);
    });

    client.on('player_ready', (data) => {
      setP1Ready(data.p1Ready);
      setP2Ready(data.p2Ready);
    });

    client.on('battle_started', (data) => {
      setBattleState(data.state);
      setIsWaitingAction(false);
      setScreen('battle');
      soundFx.playVictory();
    });

    client.on('action_accepted', () => {
      setIsWaitingAction(true);
    });

    client.on('turn_resolved', (data) => {
      const prevLogCount = battleState?.log?.length || 0;
      const newLogs = (data.state?.log || []).slice(prevLogCount);
      playTurnAnimationSequence(newLogs, data.state);
    });

    client.on('forced_switch_resolved', (data) => {
      setIsWaitingAction(false);
      setBattleState(data.state);
      if (data.state.log && data.state.log.length > 0) {
        setLastBattleEvent(data.state.log[data.state.log.length - 1]);
      }
    });

    client.on('rematch_accepted', (data) => {
      setBattleState(null);
      setP1Ready(false);
      setP2Ready(false);
      setIsWaitingAction(false);
      setScreen('multiplayer_team_builder');
    });

    client.on('opponent_disconnected', (data) => {
      setDisconnectNotice(data.message || 'Opponent disconnected from the match.');
    });

    client.on('error', (err) => {
      console.warn('Network client warning/error:', err);
    });

    return () => {
      client.disconnect();
    };
  }, [battleState]);

  const toggleSound = () => {
    soundFx.enabled = !soundEnabled;
    setSoundEnabled(!soundEnabled);
  };

  // --- VS AI Flow ---
  const handleStartVsAI = (size) => {
    soundFx.playClick();
    setBattleMode('ai');
    setTeamSize(size);
    setPlayerSide('p1');
    setScreen('ai_team_builder');
  };

  const handleStartAIBattle = (playerTeam) => {
    soundFx.playClick();
    playerTeamCacheRef.current = playerTeam;

    // Generate AI Team with matching size
    const aiTeam = AIEngine.generateTeam(teamSize);

    const engine = new BattleEngine({
      teamSize: teamSize,
      p1Name: 'Player',
      p2Name: 'AI Rival',
      p1Team: playerTeam,
      p2Team: aiTeam
    });

    localEngineRef.current = engine;
    setBattleState(engine.getState());
    setScreen('battle');
  };

  const handleSelectAIMove = (moveIndex) => {
    if (!localEngineRef.current) return;
    const engine = localEngineRef.current;

    const prevLogCount = engine.log.length;

    // Player action
    const playerAction = { type: 'move', moveIndex };

    // AI action
    const aiAction = AIEngine.chooseAction(engine);

    // Resolve Turn
    const nextState = engine.resolveTurn(playerAction, aiAction);
    const newLogs = nextState.log.slice(prevLogCount);

    playTurnAnimationSequence(newLogs, nextState);

    // If AI needs a forced switch, execute it after turn sequence
    if (nextState.phase === 'forced_switch' && (nextState.forcedSwitchSide === 'p2' || nextState.forcedSwitchSide === 'both')) {
      const delay = Math.max(1200, newLogs.length * 700);
      setTimeout(() => {
        const aiSwitch = AIEngine.chooseForcedSwitch(engine);
        const resolvedState = engine.resolveForcedSwitch('p2', aiSwitch.targetIndex);
        setBattleState({ ...resolvedState });
      }, delay);
    }
  };

  const handleSelectAISwitch = (targetIndex) => {
    if (!localEngineRef.current) return;
    const engine = localEngineRef.current;

    if (engine.phase === 'forced_switch') {
      const nextState = engine.resolveForcedSwitch('p1', targetIndex);
      setBattleState({ ...nextState });

      // If AI also fainted and needs forced switch
      if (nextState.phase === 'forced_switch' && nextState.forcedSwitchSide === 'p2') {
        setTimeout(() => {
          const aiSwitch = AIEngine.chooseForcedSwitch(engine);
          const resolvedState = engine.resolveForcedSwitch('p2', aiSwitch.targetIndex);
          setBattleState({ ...resolvedState });
        }, 500);
      }
      return;
    }

    const prevLogCount = engine.log.length;

    // Normal Switch action during turn
    const playerAction = { type: 'switch', targetIndex };
    const aiAction = AIEngine.chooseAction(engine);

    const nextState = engine.resolveTurn(playerAction, aiAction);
    const newLogs = nextState.log.slice(prevLogCount);

    playTurnAnimationSequence(newLogs, nextState);

    if (nextState.phase === 'forced_switch' && (nextState.forcedSwitchSide === 'p2' || nextState.forcedSwitchSide === 'both')) {
      const delay = Math.max(1200, newLogs.length * 700);
      setTimeout(() => {
        const aiSwitch = AIEngine.chooseForcedSwitch(engine);
        const resolvedState = engine.resolveForcedSwitch('p2', aiSwitch.targetIndex);
        setBattleState({ ...resolvedState });
      }, delay);
    }
  };

  const handleAIForfeit = () => {
    if (!localEngineRef.current) return;
    const engine = localEngineRef.current;
    engine.winner = 'p2';
    engine.phase = 'game_over';
    engine.addLog('Player forfeited the match!', 'game_over');
    setBattleState(engine.getState());
  };

  const handleAIRematch = () => {
    if (playerTeamCacheRef.current && playerTeamCacheRef.current.length > 0) {
      handleStartAIBattle(playerTeamCacheRef.current);
    } else {
      setScreen('ai_team_builder');
    }
  };

  // --- VS Friend Flow ---
  const handleOpenMultiplayer = () => {
    soundFx.playClick();
    setBattleMode('multiplayer');
    if (networkClientRef.current) {
      networkClientRef.current.connect().catch((e) => console.warn('WS Connect error:', e));
    }
    setScreen('multiplayer_lobby');
  };

  const handleCreateRoom = (name, size) => {
    setTeamSize(size);
    if (networkClientRef.current) {
      networkClientRef.current.createRoom(name, size);
    }
  };

  const handleJoinRoom = (code, name) => {
    if (networkClientRef.current) {
      networkClientRef.current.joinRoom(code, name);
    }
  };

  const handleSetTeamSize = (size) => {
    setTeamSize(size);
    if (networkClientRef.current) {
      networkClientRef.current.setTeamSize(size);
    }
  };

  const handleStartMpTeamBuilding = () => {
    setScreen('multiplayer_team_builder');
  };

  const handleSubmitMpTeam = (team) => {
    if (networkClientRef.current) {
      networkClientRef.current.submitTeam(team);
    }
  };

  const handleSelectMpMove = (moveIndex) => {
    if (networkClientRef.current) {
      networkClientRef.current.submitAction({ type: 'move', moveIndex });
    }
  };

  const handleSelectMpSwitch = (targetIndex) => {
    if (!battleState) return;
    if (battleState.phase === 'forced_switch') {
      if (networkClientRef.current) {
        networkClientRef.current.submitForcedSwitch(targetIndex);
      }
    } else {
      if (networkClientRef.current) {
        networkClientRef.current.submitAction({ type: 'switch', targetIndex });
      }
    }
  };

  const handleMpForfeit = () => {
    if (networkClientRef.current) {
      networkClientRef.current.leaveRoom();
    }
    setScreen('main_menu');
  };

  const handleMpRematch = () => {
    if (networkClientRef.current) {
      networkClientRef.current.rematch();
    }
  };

  const handleReturnToLobby = () => {
    if (networkClientRef.current && battleMode === 'multiplayer') {
      networkClientRef.current.leaveRoom();
    }
    setRoomCode(null);
    setBattleState(null);
    setDisconnectNotice(null);
    setScreen('main_menu');
  };

  // Derive active Pokemon representations
  const p1Active = battleState?.p1Team?.[battleState?.p1ActiveIndex];
  const p2Active = battleState?.p2Team?.[battleState?.p2ActiveIndex];
  const myActive = playerSide === 'p1' ? p1Active : p2Active;
  const myTeam = playerSide === 'p1' ? battleState?.p1Team || [] : battleState?.p2Team || [];
  const myActiveIndex = playerSide === 'p1' ? battleState?.p1ActiveIndex : battleState?.p2ActiveIndex;

  const isForcedSwitching = battleState?.phase === 'forced_switch' && (battleState?.forcedSwitchSide === playerSide || battleState?.forcedSwitchSide === 'both');

  return (
    <ErrorBoundary onReset={handleReturnToLobby}>
      {/* Header */}
      <header className="app-header">
        <div className="logo-container" onClick={handleReturnToLobby}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.75rem' }}>⚔️</span>
            <span className="logo-title">POKÉMON ARENA PvP</span>
          </div>
          <span className="logo-badge">GEN 1–8 (898 POKÉMON)</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: soundEnabled ? 'var(--accent-gold)' : 'var(--text-muted)',
              padding: '0.45rem',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main>
        {/* Disconnect Alert Notice */}
        {disconnectNotice && (
          <div
            style={{
              maxWidth: '650px',
              margin: '1.5rem auto 0',
              padding: '1rem',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid var(--accent-red)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center'
            }}
          >
            <p style={{ color: 'var(--accent-red)', fontWeight: 700, marginBottom: '0.75rem' }}>
              {disconnectNotice}
            </p>
            <button
              className="btn-secondary"
              onClick={handleReturnToLobby}
              style={{ margin: '0 auto', padding: '0.5rem 1rem' }}
            >
              Return to Main Menu
            </button>
          </div>
        )}

        {/* 1. Main Menu Screen */}
        {screen === 'main_menu' && (
          <div style={{ maxWidth: '900px', margin: '3rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
            <div style={{ marginBottom: '2.5rem' }}>
              <h1
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '2.75rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: '0.75rem'
                }}
              >
                1v1 Pokémon Battle Simulator
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem', maxWidth: '650px', margin: '0 auto' }}>
                Complete competitive 1v1 battle engine featuring all 898 Pokémon from Generation 1 through Generation 8, authentic damage formulas, custom move selection, abilities, held items, visual attack animations, and live turn synchronization.
              </p>
            </div>

            {/* Game Modes Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
              {/* VS AI Card */}
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  textAlign: 'left',
                  boxShadow: 'var(--shadow-main)',
                  transition: 'transform 0.2s ease'
                }}
              >
                <div>
                  <div style={{ display: 'inline-flex', padding: '0.75rem', background: 'rgba(59, 130, 246, 0.15)', borderRadius: 'var(--radius-md)', color: 'var(--accent-blue)', marginBottom: '1rem' }}>
                    <Bot size={32} />
                  </div>
                  <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: '#fff', marginBottom: '0.5rem' }}>
                    VS AI Trainer
                  </h2>
                  <p style={{ color: 'var(--text-sub)', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
                    Single-player battle against an AI trainer. Build and customize your team of 3 or 6 Pokémon with custom moves!
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    className="btn-primary"
                    onClick={() => handleStartVsAI(3)}
                    style={{ flex: 1, padding: '0.75rem' }}
                  >
                    3v3 Fast Battle
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => handleStartVsAI(6)}
                    style={{ flex: 1, padding: '0.75rem' }}
                  >
                    6v6 Full Match
                  </button>
                </div>
              </div>

              {/* VS Friend Card */}
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  textAlign: 'left',
                  boxShadow: 'var(--shadow-main)'
                }}
              >
                <div>
                  <div style={{ display: 'inline-flex', padding: '0.75rem', background: 'rgba(245, 158, 11, 0.15)', borderRadius: 'var(--radius-md)', color: 'var(--accent-gold)', marginBottom: '1rem' }}>
                    <Users size={32} />
                  </div>
                  <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: '#fff', marginBottom: '0.5rem' }}>
                    VS Friend Online
                  </h2>
                  <p style={{ color: 'var(--text-sub)', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
                    Host or join a private room using a 6-character room code to battle live with customized movesets.
                  </p>
                </div>

                <button
                  className="btn-primary"
                  onClick={handleOpenMultiplayer}
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    boxShadow: '0 4px 14px rgba(217, 119, 6, 0.35)',
                    padding: '0.75rem'
                  }}
                >
                  Create or Join Room
                </button>
              </div>
            </div>

            {/* Quick Stats Banner */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: '2rem',
                padding: '1.25rem',
                background: 'rgba(22, 27, 34, 0.5)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                fontSize: '0.9rem',
                color: 'var(--text-muted)'
              }}
            >
              <div>✨ <strong>898</strong> Pokémon (Gen 1–8)</div>
              <div>⚡ <strong>Custom</strong> 4-Move Builder</div>
              <div>🔥 <strong>Visual</strong> Attack Animations</div>
              <div>🔒 <strong>Strict 1v1</strong> Single Battles</div>
            </div>
          </div>
        )}

        {/* 2. Team Builder for VS AI */}
        {screen === 'ai_team_builder' && (
          <TeamBuilder
            teamSize={teamSize}
            onTeamSizeChange={(sz) => setTeamSize(sz)}
            onStartBattle={handleStartAIBattle}
            onBackToLobby={handleReturnToLobby}
            isMultiplayer={false}
          />
        )}

        {/* 3. Multiplayer Lobby */}
        {screen === 'multiplayer_lobby' && (
          <MultiplayerLobby
            networkClient={networkClientRef.current}
            isConnected={isWsConnected}
            roomCode={roomCode}
            playerId={mpPlayerId}
            opponentName={opponentName}
            teamSize={teamSize}
            p1Ready={p1Ready}
            p2Ready={p2Ready}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onSetTeamSize={handleSetTeamSize}
            onStartTeamBuilding={handleStartMpTeamBuilding}
            onBackToMain={handleReturnToLobby}
          />
        )}

        {/* 4. Multiplayer Team Builder */}
        {screen === 'multiplayer_team_builder' && (
          <TeamBuilder
            teamSize={teamSize}
            onTeamSizeChange={null} // synced from room
            onStartBattle={handleSubmitMpTeam}
            onBackToLobby={handleReturnToLobby}
            isMultiplayer={true}
            opponentReady={mpPlayerId === 'p1' ? p2Ready : p1Ready}
          />
        )}

        {/* 5. Battle Arena Screen */}
        {screen === 'battle' && battleState && (
          <div className="battle-container">
            {/* Arena Stage */}
            <BattleArena
              p1Active={playerSide === 'p1' ? p1Active : p2Active}
              p2Active={playerSide === 'p1' ? p2Active : p1Active}
              p1Team={playerSide === 'p1' ? battleState.p1Team : battleState.p2Team}
              p2Team={playerSide === 'p1' ? battleState.p2Team : battleState.p1Team}
              p1Name={playerSide === 'p1' ? battleState.p1Name : battleState.p2Name}
              p2Name={playerSide === 'p1' ? battleState.p2Name : battleState.p1Name}
              weather={battleState.weather}
              lastEvent={lastBattleEvent}
            />

            {/* Controls and Battle Log */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
              <BattleControls
                activePokemon={myActive}
                team={myTeam}
                activeIndex={myActiveIndex}
                onSelectMove={battleMode === 'ai' ? handleSelectAIMove : handleSelectMpMove}
                onSelectSwitch={battleMode === 'ai' ? handleSelectAISwitch : handleSelectMpSwitch}
                onForfeit={battleMode === 'ai' ? handleAIForfeit : handleMpForfeit}
                isWaiting={isWaitingAction}
                isForcedSwitch={isForcedSwitching}
                disabled={battleState.phase === 'game_over'}
              />

              <BattleLog logs={battleState.log || []} />
            </div>

            {/* Victory / Defeat Result Modal */}
            {battleState.phase === 'game_over' && (
              <VictoryDefeatModal
                winner={battleState.winner}
                playerSide={playerSide}
                p1Name={battleState.p1Name}
                p2Name={battleState.p2Name}
                p1Team={battleState.p1Team}
                p2Team={battleState.p2Team}
                turnCount={battleState.turn}
                onRematch={battleMode === 'ai' ? handleAIRematch : handleMpRematch}
                onReturnToLobby={handleReturnToLobby}
              />
            )}
          </div>
        )}
      </main>
    </ErrorBoundary>
  );
}
