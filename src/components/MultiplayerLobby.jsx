import React, { useState, useEffect } from 'react';
import { Users, Copy, Check, ArrowRight, ShieldCheck, Wifi, ArrowLeft, RefreshCw, Server, AlertCircle } from 'lucide-react';
import { soundFx } from '../game/soundEffects.js';

export function MultiplayerLobby({
  networkClient,
  isConnected,
  roomCode,
  playerId,
  opponentName,
  teamSize = 3,
  p1Ready = false,
  p2Ready = false,
  onCreateRoom,
  onJoinRoom,
  onSetTeamSize,
  onStartTeamBuilding,
  onBackToMain
}) {
  const [playerName, setPlayerName] = useState('Trainer');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [selectedSize, setSelectedSize] = useState(teamSize);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'join'
  const [isConnecting, setIsConnecting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customServerUrl, setCustomServerUrl] = useState(networkClient?.url || 'ws://localhost:8080');

  useEffect(() => {
    // Attempt automatic connection when entering lobby
    if (networkClient && !isConnected) {
      setIsConnecting(true);
      networkClient.connect().finally(() => setIsConnecting(false));
    }
  }, [networkClient, isConnected]);

  const handleReconnect = () => {
    if (networkClient) {
      setIsConnecting(true);
      networkClient.connect(customServerUrl).finally(() => setIsConnecting(false));
    }
  };

  const handleCopyCode = () => {
    if (roomCode) {
      soundFx.playClick();
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    soundFx.playClick();

    if (!isConnected && networkClient) {
      setIsConnecting(true);
      try {
        await networkClient.connect(customServerUrl);
      } catch (err) {
        setIsConnecting(false);
        return;
      }
      setIsConnecting(false);
    }

    onCreateRoom(playerName.trim() || 'Player 1', selectedSize);
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    soundFx.playClick();

    if (!isConnected && networkClient) {
      setIsConnecting(true);
      try {
        await networkClient.connect(customServerUrl);
      } catch (err) {
        setIsConnecting(false);
        return;
      }
      setIsConnecting(false);
    }

    onJoinRoom(joinCodeInput.trim().toUpperCase(), playerName.trim() || 'Player 2');
  };

  const handleSizeSelect = (sz) => {
    soundFx.playClick();
    setSelectedSize(sz);
    if (roomCode && playerId === 'p1') {
      onSetTeamSize(sz);
    }
  };

  return (
    <div style={{ maxWidth: '680px', margin: '2rem auto', padding: '0 1rem' }}>
      <button
        onClick={onBackToMain}
        className="btn-secondary"
        style={{ marginBottom: '1.25rem', padding: '0.5rem 0.9rem' }}
      >
        <ArrowLeft size={16} /> Back to Main Menu
      </button>

      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '2rem',
          boxShadow: 'var(--shadow-main)'
        }}
      >
        {/* Connection Status Badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={24} color="var(--accent-blue)" />
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: '#fff' }}>
              VS FRIEND ONLINE
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.8rem',
                padding: '0.25rem 0.65rem',
                borderRadius: 'var(--radius-full)',
                background: isConnected ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: `1px solid ${isConnected ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                color: isConnected ? 'var(--hp-green)' : 'var(--accent-red)',
                fontWeight: 600
              }}
            >
              <Wifi size={14} />
              {isConnected ? 'Server Connected' : isConnecting ? 'Connecting...' : 'Offline'}
            </div>

            {!isConnected && (
              <button
                onClick={handleReconnect}
                disabled={isConnecting}
                title="Retry Connection"
                style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  color: 'var(--accent-blue)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                <RefreshCw size={12} className={isConnecting ? 'anim-spin' : ''} /> Retry
              </button>
            )}
          </div>
        </div>

        {/* Offline Server Alert */}
        {!isConnected && (
          <div
            style={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              marginBottom: '1.25rem',
              fontSize: '0.85rem',
              color: 'var(--text-sub)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem'
            }}
          >
            <AlertCircle size={20} color="var(--accent-gold)" style={{ flexShrink: 0 }} />
            <div>
              Connecting to battle server at <strong style={{ color: '#fff' }}>{customServerUrl}</strong>. If running locally, make sure <code style={{ color: 'var(--accent-gold)' }}>npm run server</code> or <code style={{ color: 'var(--accent-gold)' }}>npm run dev</code> is running.
            </div>
          </div>
        )}

        {/* If Not in Room yet: Tabs for Create vs Join */}
        {!roomCode ? (
          <div>
            <div style={{ display: 'flex', background: '#0d1117', padding: '4px', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
              <button
                onClick={() => { soundFx.playClick(); setActiveTab('create'); }}
                style={{
                  flex: 1,
                  padding: '0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  background: activeTab === 'create' ? 'var(--accent-blue)' : 'transparent',
                  color: activeTab === 'create' ? '#fff' : 'var(--text-muted)'
                }}
              >
                Create Room
              </button>
              <button
                onClick={() => { soundFx.playClick(); setActiveTab('join'); }}
                style={{
                  flex: 1,
                  padding: '0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  background: activeTab === 'join' ? 'var(--accent-blue)' : 'transparent',
                  color: activeTab === 'join' ? '#fff' : 'var(--text-muted)'
                }}
              >
                Join Room
              </button>
            </div>

            {/* Trainer Name Input */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-sub)', marginBottom: '0.4rem', fontWeight: 600 }}>
                Trainer Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name..."
                maxLength={20}
                style={{
                  width: '100%',
                  background: '#0d1117',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem',
                  color: '#fff',
                  fontSize: '0.95rem'
                }}
              />
            </div>

            {activeTab === 'create' ? (
              <form onSubmit={handleCreate}>
                {/* Team Size Selection */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-sub)', marginBottom: '0.4rem', fontWeight: 600 }}>
                    Battle Team Size
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => handleSizeSelect(3)}
                      style={{
                        padding: '0.75rem',
                        background: selectedSize === 3 ? 'rgba(59, 130, 246, 0.2)' : '#0d1117',
                        border: selectedSize === 3 ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        color: selectedSize === 3 ? '#fff' : 'var(--text-muted)',
                        fontWeight: 700,
                        fontFamily: 'var(--font-heading)'
                      }}
                    >
                      3 vs 3 (Fast Battle)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSizeSelect(6)}
                      style={{
                        padding: '0.75rem',
                        background: selectedSize === 6 ? 'rgba(59, 130, 246, 0.2)' : '#0d1117',
                        border: selectedSize === 6 ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        color: selectedSize === 6 ? '#fff' : 'var(--text-muted)',
                        fontWeight: 700,
                        fontFamily: 'var(--font-heading)'
                      }}
                    >
                      6 vs 6 (Full Competitive)
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isConnecting}
                  className="btn-primary"
                  style={{ width: '100%', padding: '0.9rem' }}
                >
                  Generate Room Code
                </button>
              </form>
            ) : (
              <form onSubmit={handleJoin}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-sub)', marginBottom: '0.4rem', fontWeight: 600 }}>
                    6-Character Room Code
                  </label>
                  <input
                    type="text"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    placeholder="e.g. AB12CD"
                    maxLength={6}
                    style={{
                      width: '100%',
                      background: '#0d1117',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem',
                      color: 'var(--accent-gold)',
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      letterSpacing: '3px',
                      textAlign: 'center',
                      fontFamily: 'var(--font-heading)'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isConnecting || !joinCodeInput.trim()}
                  className="btn-primary"
                  style={{ width: '100%', padding: '0.9rem' }}
                >
                  Join Battle Room
                </button>
              </form>
            )}

            {/* Advanced Server Settings Accordion */}
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                style={{
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  cursor: 'pointer'
                }}
              >
                <Server size={14} /> Server Configuration {showAdvanced ? '▲' : '▼'}
              </button>

              {showAdvanced && (
                <div style={{ marginTop: '0.75rem', background: '#0d1117', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                    WebSocket Server URL
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      value={customServerUrl}
                      onChange={(e) => setCustomServerUrl(e.target.value)}
                      placeholder="ws://localhost:8080"
                      style={{
                        flex: 1,
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.4rem 0.6rem',
                        color: '#fff',
                        fontSize: '0.8rem',
                        fontFamily: 'monospace'
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleReconnect}
                      className="btn-secondary"
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
                    >
                      Connect
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Inside Room Waiting Lobby */
          <div>
            {/* Room Code Banner */}
            <div
              style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                textAlign: 'center',
                marginBottom: '1.5rem'
              }}
            >
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                Your Room Code
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '2.2rem',
                    fontWeight: 800,
                    letterSpacing: '4px',
                    color: 'var(--accent-gold)'
                  }}
                >
                  {roomCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  style={{
                    background: '#0d1117',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.45rem 0.75rem',
                    color: copied ? 'var(--hp-green)' : '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '0.85rem'
                  }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-sub)', marginTop: '0.5rem' }}>
                Share this 6-letter room code with your friend so they can join your 1v1 battle!
              </div>
            </div>

            {/* Players Status Box */}
            <div
              style={{
                background: '#0d1117',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <strong style={{ color: '#fff' }}>Player 1 (Host):</strong> {playerId === 'p1' ? `${playerName} (You)` : opponentName || 'Host'}
                </div>
                <span style={{ fontSize: '0.8rem', color: p1Ready ? 'var(--hp-green)' : 'var(--accent-gold)', fontWeight: 700 }}>
                  {p1Ready ? '✓ READY' : 'SELECTING TEAM'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
                <div>
                  <strong style={{ color: '#fff' }}>Player 2 (Guest):</strong> {playerId === 'p2' ? `${playerName} (You)` : opponentName ? opponentName : 'Waiting for friend to join...'}
                </div>
                <span style={{ fontSize: '0.8rem', color: p2Ready ? 'var(--hp-green)' : opponentName ? 'var(--accent-gold)' : 'var(--text-muted)', fontWeight: 700 }}>
                  {opponentName ? (p2Ready ? '✓ READY' : 'SELECTING TEAM') : 'WAITING'}
                </span>
              </div>
            </div>

            {/* Team Size info */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-sub)' }}>
              Battle Format: <strong style={{ color: '#fff' }}>1v1 ({teamSize} Pokémon per team)</strong>
            </div>

            {/* Proceed to Team Builder Button */}
            <button
              onClick={() => { soundFx.playClick(); onStartTeamBuilding(); }}
              disabled={!opponentName && playerId === 'p1'}
              className="btn-primary"
              style={{ width: '100%', padding: '0.9rem' }}
            >
              <ArrowRight size={18} />
              {!opponentName ? 'Waiting for Friend to Join...' : 'Build Team & Lock In'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
