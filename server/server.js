import { WebSocketServer, WebSocket } from 'ws';
import { BattleEngine } from '../src/game/BattleEngine.js';

let PORT = Number(process.env.PORT) || 8080;

function startServer(portToTry) {
  const wss = new WebSocketServer({ port: portToTry });

  wss.on('listening', () => {
    console.log(`[Pokemon PvP Server] WebSocket server successfully listening on port ${portToTry}`);
  });

  wss.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Pokemon PvP Server] Port ${portToTry} is in use, trying port ${portToTry + 1}...`);
      startServer(portToTry + 1);
    } else {
      console.error('[Pokemon PvP Server] Server error:', err);
    }
  });

  const rooms = new Map();

  function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  function sendJson(ws, data) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(data));
      } catch (e) {
        console.error('Error sending message to client:', e.message);
      }
    }
  }

  function broadcastToRoom(room, data) {
    if (room.p1 && room.p1.ws) sendJson(room.p1.ws, data);
    if (room.p2 && room.p2.ws) sendJson(room.p2.ws, data);
  }

  wss.on('connection', (ws) => {
    let currentRoomCode = null;
    let currentPlayerId = null;

    console.log('[Connection] New client connected');

    ws.on('message', (raw) => {
      try {
        const data = JSON.parse(raw.toString());
        const { type } = data;

        switch (type) {
          case 'create_room': {
            let code = generateRoomCode();
            while (rooms.has(code)) {
              code = generateRoomCode();
            }

            const room = {
              roomCode: code,
              teamSize: data.teamSize === 6 ? 6 : 3,
              p1: {
                ws,
                id: 'p1',
                name: data.playerName || 'Player 1',
                team: null,
                ready: false,
                pendingAction: null,
                pendingForcedSwitch: null
              },
              p2: null,
              battleEngine: null,
              status: 'lobby'
            };

            rooms.set(code, room);
            currentRoomCode = code;
            currentPlayerId = 'p1';

            sendJson(ws, {
              type: 'room_created',
              roomCode: code,
              playerId: 'p1',
              teamSize: room.teamSize,
              roomStatus: room.status
            });

            console.log(`[Room Created] Room ${code} created by ${room.p1.name}`);
            break;
          }

          case 'join_room': {
            const code = (data.roomCode || '').toUpperCase().trim();
            const room = rooms.get(code);

            if (!room) {
              sendJson(ws, { type: 'error', message: `Room "${code}" not found.` });
              return;
            }

            if (room.p2 && room.p2.ws && room.p2.ws.readyState === WebSocket.OPEN) {
              sendJson(ws, { type: 'error', message: `Room "${code}" is already full.` });
              return;
            }

            room.p2 = {
              ws,
              id: 'p2',
              name: data.playerName || 'Player 2',
              team: null,
              ready: false,
              pendingAction: null,
              pendingForcedSwitch: null
            };

            currentRoomCode = code;
            currentPlayerId = 'p2';

            sendJson(ws, {
              type: 'room_joined',
              roomCode: code,
              playerId: 'p2',
              teamSize: room.teamSize,
              opponentName: room.p1.name,
              roomStatus: room.status
            });

            sendJson(room.p1.ws, {
              type: 'opponent_joined',
              opponentName: room.p2.name,
              teamSize: room.teamSize
            });

            console.log(`[Room Joined] ${room.p2.name} joined room ${code}`);
            break;
          }

          case 'set_team_size': {
            const room = rooms.get(currentRoomCode);
            if (!room || room.status !== 'lobby') return;
            if (currentPlayerId !== 'p1') return;

            room.teamSize = data.teamSize === 6 ? 6 : 3;
            broadcastToRoom(room, {
              type: 'team_size_updated',
              teamSize: room.teamSize
            });
            break;
          }

          case 'submit_team': {
            const room = rooms.get(currentRoomCode);
            if (!room) return;

            const player = currentPlayerId === 'p1' ? room.p1 : room.p2;
            if (!player) return;

            if (!Array.isArray(data.team) || data.team.length !== room.teamSize) {
              sendJson(ws, {
                type: 'error',
                message: `Invalid team. Must contain exactly ${room.teamSize} Pokémon.`
              });
              return;
            }

            player.team = data.team;
            player.ready = true;

            broadcastToRoom(room, {
              type: 'player_ready',
              playerId: currentPlayerId,
              p1Ready: room.p1?.ready || false,
              p2Ready: room.p2?.ready || false
            });

            if (room.p1 && room.p2 && room.p1.ready && room.p2.ready) {
              try {
                room.battleEngine = new BattleEngine({
                  teamSize: room.teamSize,
                  p1Name: room.p1.name,
                  p2Name: room.p2.name,
                  p1Team: room.p1.team,
                  p2Team: room.p2.team
                });

                room.status = 'battle';

                broadcastToRoom(room, {
                  type: 'battle_started',
                  state: room.battleEngine.getState()
                });

                console.log(`[Battle Started] Room ${room.roomCode} started 1v1 battle!`);
              } catch (err) {
                console.error('Error starting battle:', err);
                broadcastToRoom(room, {
                  type: 'error',
                  message: `Failed to initialize battle: ${err.message}`
                });
              }
            }
            break;
          }

          case 'submit_action': {
            const room = rooms.get(currentRoomCode);
            if (!room || !room.battleEngine || room.status !== 'battle') return;

            const player = currentPlayerId === 'p1' ? room.p1 : room.p2;
            if (!player) return;

            if (player.pendingAction) {
              sendJson(ws, { type: 'info', message: 'Action already submitted. Waiting for opponent.' });
              return;
            }

            const action = data.action;
            if (!action || (action.type !== 'move' && action.type !== 'switch')) {
              sendJson(ws, { type: 'error', message: 'Invalid action submitted.' });
              return;
            }

            player.pendingAction = action;
            sendJson(ws, { type: 'action_accepted' });

            const opponent = currentPlayerId === 'p1' ? room.p2 : room.p1;
            if (opponent && opponent.ws) {
              sendJson(opponent.ws, { type: 'opponent_action_submitted' });
            }

            if (room.p1.pendingAction && room.p2.pendingAction) {
              const p1Act = room.p1.pendingAction;
              const p2Act = room.p2.pendingAction;

              room.p1.pendingAction = null;
              room.p2.pendingAction = null;

              try {
                const nextState = room.battleEngine.resolveTurn(p1Act, p2Act);
                broadcastToRoom(room, {
                  type: 'turn_resolved',
                  state: nextState
                });

                if (nextState.phase === 'game_over') {
                  room.status = 'finished';
                }
              } catch (err) {
                console.error('Error resolving turn:', err);
                broadcastToRoom(room, {
                  type: 'error',
                  message: `Turn resolution error: ${err.message}`
                });
              }
            }
            break;
          }

          case 'submit_forced_switch': {
            const room = rooms.get(currentRoomCode);
            if (!room || !room.battleEngine || room.status !== 'battle') return;

            const targetIndex = Number(data.targetIndex);
            try {
              const nextState = room.battleEngine.resolveForcedSwitch(currentPlayerId, targetIndex);
              broadcastToRoom(room, {
                type: 'forced_switch_resolved',
                state: nextState
              });
            } catch (err) {
              console.error('Error during forced switch:', err);
              sendJson(ws, {
                type: 'error',
                message: `Forced switch error: ${err.message}`
              });
            }
            break;
          }

          case 'rematch': {
            const room = rooms.get(currentRoomCode);
            if (!room) return;

            room.status = 'lobby';
            room.battleEngine = null;
            if (room.p1) {
              room.p1.ready = false;
              room.p1.pendingAction = null;
            }
            if (room.p2) {
              room.p2.ready = false;
              room.p2.pendingAction = null;
            }

            broadcastToRoom(room, {
              type: 'rematch_accepted',
              teamSize: room.teamSize
            });
            break;
          }

          case 'leave_room': {
            handleDisconnect(currentRoomCode, currentPlayerId);
            currentRoomCode = null;
            currentPlayerId = null;
            break;
          }

          case 'ping': {
            sendJson(ws, { type: 'pong' });
            break;
          }

          default:
            console.warn('Unknown message type received:', type);
        }
      } catch (err) {
        console.error('Malformed WebSocket message:', err.message);
        sendJson(ws, { type: 'error', message: 'Malformed message.' });
      }
    });

    function handleDisconnect(code, playerId) {
      if (!code || !rooms.has(code)) return;
      const room = rooms.get(code);

      console.log(`[Disconnect] Player ${playerId} disconnected from room ${code}`);

      const remaining = playerId === 'p1' ? room.p2 : room.p1;
      if (remaining && remaining.ws && remaining.ws.readyState === WebSocket.OPEN) {
        sendJson(remaining.ws, {
          type: 'opponent_disconnected',
          message: 'Your opponent disconnected from the battle.'
        });
      }

      rooms.delete(code);
    }

    ws.on('close', () => {
      handleDisconnect(currentRoomCode, currentPlayerId);
    });

    ws.on('error', (err) => {
      console.error('Client WebSocket error:', err.message);
      handleDisconnect(currentRoomCode, currentPlayerId);
    });
  });

  return wss;
}

startServer(PORT);
