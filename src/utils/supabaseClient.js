import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Mock database room cache for LocalStorage/BroadcastChannel fallback
const LOCAL_ROOM_PREFIX = 'monopoly_room_';

// BroadcastChannel fallback for multi-tab testing without Supabase
class MockRealtimeManager {
  constructor() {
    this.channels = {};
  }

  getChannel(roomCode, callback) {
    const channelName = `room_channel_${roomCode}`;
    if (this.channels[channelName]) {
      return this.channels[channelName];
    }

    const bc = new BroadcastChannel(channelName);
    bc.onmessage = (event) => {
      callback(event.data);
    };

    const channel = {
      send: (payload) => {
        bc.postMessage(payload);
      },
      unsubscribe: () => {
        bc.close();
        delete this.channels[channelName];
      }
    };

    this.channels[channelName] = channel;
    return channel;
  }
}

export const mockRealtime = new MockRealtimeManager();

/**
 * Helper to host/create a room
 */
export async function createRoom(roomCode, hostName, hostToken, boardTheme) {
  const initialRoomState = {
    id: roomCode,
    room_code: roomCode,
    board_theme: boardTheme,
    status: 'lobby',
    players: [
      {
        id: 'host_' + Math.random().toString(36).substr(2, 9),
        name: hostName,
        token: hostToken,
        balance: boardTheme === 'INDIAN_BUSINESS' ? 25000 : 1500,
        position: 0,
        isBankrupt: false,
        inJail: false,
        jailTurns: 0,
        isHost: true,
        isBot: false,
      }
    ],
    gameState: {
      turnIndex: 0,
      dice: [1, 1],
      isDiceRolled: false,
      properties: [], // owned properties
      logs: [`Room created by ${hostName}`],
      gameStarted: false,
    },
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('game_rooms')
        .insert({
          room_code: roomCode,
          players: initialRoomState.players,
          game_state: initialRoomState.gameState,
          board_theme: boardTheme,
          status: 'lobby',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('Supabase createRoom failed, falling back to LocalStorage', err);
    }
  }

  // Fallback to local storage
  localStorage.setItem(LOCAL_ROOM_PREFIX + roomCode, JSON.stringify(initialRoomState));
  return initialRoomState;
}

/**
 * Helper to join a room
 */
export async function joinRoom(roomCode, playerName, playerToken) {
  if (isSupabaseConfigured) {
    try {
      // Get room
      const { data: room, error } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('room_code', roomCode)
        .single();

      if (error) throw error;
      if (!room) throw new Error('Room not found');
      if (room.status !== 'lobby') throw new Error('Game already started');

      const players = room.players || [];
      const boardTheme = room.board_theme;
      
      const newPlayer = {
        id: 'player_' + Math.random().toString(36).substr(2, 9),
        name: playerName,
        token: playerToken,
        balance: boardTheme === 'INDIAN_BUSINESS' ? 25000 : 1500,
        position: 0,
        isBankrupt: false,
        inJail: false,
        jailTurns: 0,
        isHost: false,
        isBot: false,
      };

      const updatedPlayers = [...players, newPlayer];

      const { data: updatedRoom, error: updateError } = await supabase
        .from('game_rooms')
        .update({ players: updatedPlayers })
        .eq('room_code', roomCode)
        .select()
        .single();

      if (updateError) throw updateError;
      return updatedRoom;
    } catch (err) {
      console.warn('Supabase joinRoom failed, falling back to LocalStorage', err);
    }
  }

  // Fallback
  const rawRoom = localStorage.getItem(LOCAL_ROOM_PREFIX + roomCode);
  if (!rawRoom) throw new Error('Room not found');
  const room = JSON.parse(rawRoom);
  if (room.status !== 'lobby') throw new Error('Game already started');

  const newPlayer = {
    id: 'player_' + Math.random().toString(36).substr(2, 9),
    name: playerName,
    token: playerToken,
    balance: room.board_theme === 'INDIAN_BUSINESS' ? 25000 : 1500,
    position: 0,
    isBankrupt: false,
    inJail: false,
    jailTurns: 0,
    isHost: false,
    isBot: false,
  };

  room.players.push(newPlayer);
  room.gameState.logs.push(`${playerName} joined the room`);
  room.updated_at = new Date().toISOString();
  localStorage.setItem(LOCAL_ROOM_PREFIX + roomCode, JSON.stringify(room));

  // Sync to other tabs
  mockRealtime.getChannel(roomCode, () => {}).send({ type: 'ROOM_UPDATED', room });
  return room;
}

/**
 * Sync game state
 */
export async function syncRoomState(roomCode, players, gameState, status) {
  const updatedData = {
    players,
    game_state: gameState,
    status,
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('game_rooms')
        .update({
          players: updatedData.players,
          game_state: updatedData.game_state,
          status: updatedData.status
        })
        .eq('room_code', roomCode);

      if (!error) return;
    } catch (err) {
      console.warn('Supabase sync failed, using mock sync');
    }
  }

  // Fallback storage sync
  const rawRoom = localStorage.getItem(LOCAL_ROOM_PREFIX + roomCode);
  if (rawRoom) {
    const room = JSON.parse(rawRoom);
    room.players = players;
    room.gameState = gameState;
    room.status = status;
    room.updated_at = updatedData.updated_at;
    localStorage.setItem(LOCAL_ROOM_PREFIX + roomCode, JSON.stringify(room));

    // Send realtime message to other tabs
    mockRealtime.getChannel(roomCode, () => {}).send({ type: 'ROOM_UPDATED', room });
  }
}
