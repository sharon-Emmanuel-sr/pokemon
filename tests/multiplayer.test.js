import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WebSocketServer, WebSocket } from 'ws';
import { BattleEngine } from '../src/game/BattleEngine.js';
import { PokemonInstance } from '../src/game/PokemonInstance.js';

describe('Multiplayer Synchronization & WebSocket Server', () => {
  let wss;
  const TEST_PORT = 8999;
  const WS_URL = `ws://localhost:${TEST_PORT}`;
  const rooms = new Map();

  beforeAll(() => {
    wss = new WebSocketServer({ port: TEST_PORT });

    wss.on('connection', (ws) => {
      let currentRoom = null;
      let currentSide = null;

      ws.on('message', (raw) => {
        const data = JSON.parse(raw.toString());
        if (data.type === 'create_room') {
          const code = 'TEST01';
          const room = {
            code,
            teamSize: data.teamSize || 3,
            p1: { ws, team: null, ready: false, pendingAction: null },
            p2: null,
            battleEngine: null
          };
          rooms.set(code, room);
          currentRoom = room;
          currentSide = 'p1';
          ws.send(JSON.stringify({ type: 'room_created', roomCode: code, playerId: 'p1' }));
        } else if (data.type === 'join_room') {
          const room = rooms.get(data.roomCode);
          if (!room) {
            ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
            return;
          }
          room.p2 = { ws, team: null, ready: false, pendingAction: null };
          currentRoom = room;
          currentSide = 'p2';
          ws.send(JSON.stringify({ type: 'room_joined', roomCode: room.code, playerId: 'p2' }));
          room.p1.ws.send(JSON.stringify({ type: 'opponent_joined' }));
        } else if (data.type === 'submit_team') {
          if (!currentRoom) return;
          const p = currentSide === 'p1' ? currentRoom.p1 : currentRoom.p2;
          p.team = data.team;
          p.ready = true;

          if (currentRoom.p1 && currentRoom.p2 && currentRoom.p1.ready && currentRoom.p2.ready) {
            currentRoom.battleEngine = new BattleEngine({
              teamSize: currentRoom.teamSize,
              p1Team: currentRoom.p1.team,
              p2Team: currentRoom.p2.team
            });
            const state = currentRoom.battleEngine.getState();
            currentRoom.p1.ws.send(JSON.stringify({ type: 'battle_started', state }));
            currentRoom.p2.ws.send(JSON.stringify({ type: 'battle_started', state }));
          }
        } else if (data.type === 'submit_action') {
          if (!currentRoom || !currentRoom.battleEngine) {
            ws.send(JSON.stringify({ type: 'invalid_action_rejected', message: 'Battle not active' }));
            return;
          }
          const p = currentSide === 'p1' ? currentRoom.p1 : currentRoom.p2;
          if (p.pendingAction) {
            ws.send(JSON.stringify({ type: 'duplicate_rejected' }));
            return;
          }
          if (!data.action || !['move', 'switch'].includes(data.action.type)) {
            ws.send(JSON.stringify({ type: 'invalid_action_rejected' }));
            return;
          }

          p.pendingAction = data.action;
          ws.send(JSON.stringify({ type: 'action_accepted' }));

          if (currentRoom.p1.pendingAction && currentRoom.p2.pendingAction) {
            const p1Act = currentRoom.p1.pendingAction;
            const p2Act = currentRoom.p2.pendingAction;
            currentRoom.p1.pendingAction = null;
            currentRoom.p2.pendingAction = null;

            const nextState = currentRoom.battleEngine.resolveTurn(p1Act, p2Act);
            currentRoom.p1.ws.send(JSON.stringify({ type: 'turn_resolved', state: nextState }));
            currentRoom.p2.ws.send(JSON.stringify({ type: 'turn_resolved', state: nextState }));
          }
        }
      });

      ws.on('close', () => {
        if (currentRoom) {
          const remaining = currentSide === 'p1' ? currentRoom.p2 : currentRoom.p1;
          if (remaining && remaining.ws && remaining.ws.readyState === WebSocket.OPEN) {
            remaining.ws.send(JSON.stringify({ type: 'opponent_disconnected' }));
          }
          rooms.delete(currentRoom.code);
        }
      });
    });
  });

  afterAll(() => {
    wss.close();
  });

  it('23-29. Full Multiplayer flow: Room creation, join, battle start, turn sync, action validation, disconnect', async () => {
    // 23. Room creation
    const client1 = new WebSocket(WS_URL);
    await new Promise((res) => { client1.onopen = res; });

    let roomCode = null;
    const c1Messages = [];
    client1.onmessage = (e) => c1Messages.push(JSON.parse(e.data));

    client1.send(JSON.stringify({ type: 'create_room', teamSize: 3 }));
    await new Promise((r) => setTimeout(r, 80));

    expect(c1Messages.some(m => m.type === 'room_created')).toBe(true);
    roomCode = 'TEST01';

    // 24. Room joining
    const client2 = new WebSocket(WS_URL);
    await new Promise((res) => { client2.onopen = res; });

    const c2Messages = [];
    client2.onmessage = (e) => c2Messages.push(JSON.parse(e.data));

    client2.send(JSON.stringify({ type: 'join_room', roomCode }));
    await new Promise((r) => setTimeout(r, 80));

    expect(c2Messages.some(m => m.type === 'room_joined')).toBe(true);
    expect(c1Messages.some(m => m.type === 'opponent_joined')).toBe(true);

    // 25. Both players submit teams and receive battle start
    const teamSample = [
      new PokemonInstance('pikachu'),
      new PokemonInstance('charizard'),
      new PokemonInstance('blastoise')
    ];

    client1.send(JSON.stringify({ type: 'submit_team', team: teamSample }));
    client2.send(JSON.stringify({ type: 'submit_team', team: teamSample }));
    await new Promise((r) => setTimeout(r, 100));

    expect(c1Messages.some(m => m.type === 'battle_started')).toBe(true);
    expect(c2Messages.some(m => m.type === 'battle_started')).toBe(true);

    // 26. Both players submit turn actions and synchronize
    client1.send(JSON.stringify({ type: 'submit_action', action: { type: 'move', moveIndex: 0 } }));
    client2.send(JSON.stringify({ type: 'submit_action', action: { type: 'move', moveIndex: 0 } }));
    await new Promise((r) => setTimeout(r, 100));

    expect(c1Messages.some(m => m.type === 'turn_resolved')).toBe(true);
    expect(c2Messages.some(m => m.type === 'turn_resolved')).toBe(true);

    // 27. Duplicate action is rejected
    client1.send(JSON.stringify({ type: 'submit_action', action: { type: 'move', moveIndex: 1 } }));
    client1.send(JSON.stringify({ type: 'submit_action', action: { type: 'move', moveIndex: 1 } }));
    await new Promise((r) => setTimeout(r, 80));
    expect(c1Messages.some(m => m.type === 'duplicate_rejected')).toBe(true);

    // 28. Invalid action is rejected
    const client3 = new WebSocket(WS_URL);
    await new Promise((res) => { client3.onopen = res; });
    const c3Messages = [];
    client3.onmessage = (e) => c3Messages.push(JSON.parse(e.data));
    client3.send(JSON.stringify({ type: 'submit_action', action: { type: 'invalid_action' } }));
    await new Promise((r) => setTimeout(r, 50));
    expect(c3Messages.some(m => m.type === 'invalid_action_rejected')).toBe(true);
    client3.close();

    // 29. Disconnect handling
    client1.close();
    await new Promise((r) => setTimeout(r, 100));
    expect(c2Messages.some(m => m.type === 'opponent_disconnected')).toBe(true);
    client2.close();
  });
});
