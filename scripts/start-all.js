import { spawn } from 'child_process';
import path from 'path';

console.log('🚀 Starting Pokémon Arena PvP (Frontend + WebSocket Server)...');

// Start WebSocket Server
const serverProcess = spawn('node', ['server/server.js'], {
  stdio: 'inherit',
  shell: true
});

// Start Vite Dev Server with --host for local network access
const viteProcess = spawn('npx', ['vite', '--host', '0.0.0.0', '--port', '3000'], {
  stdio: 'inherit',
  shell: true
});

function cleanup() {
  console.log('\n🛑 Shutting down server and client...');
  try { serverProcess.kill(); } catch (e) {}
  try { viteProcess.kill(); } catch (e) {}
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
