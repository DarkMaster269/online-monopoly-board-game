import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { createRoom, joinRoom, isSupabaseConfigured } from '../utils/supabaseClient';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Globe, 
  Crown, 
  Copy, 
  Play, 
  Dice5, 
  Users, 
  Bot, 
  Sparkles, 
  Palette, 
  BookOpen, 
  X, 
  Dice3, 
  Check 
} from "lucide-react";
import RulesModal2D from './RulesModal';

const TOKEN_COLORS = [
  { key: "mint", hex: "var(--mint)", name: "Mint" },
  { key: "coral", hex: "var(--coral)", name: "Coral" },
  { key: "sun", hex: "var(--sun)", name: "Amber" },
  { key: "sky", hex: "var(--sky)", name: "Sky" },
  { key: "grape", hex: "var(--grape)", name: "Grape" },
  { key: "rose", hex: "var(--rose)", name: "Rose" },
];

const AVATARS = ["🦊", "🐼", "🦁", "🐯", "🐸", "🐵", "🦄", "🐙", "🐧"];

export default function Lobby() {
  const { 
    startLocalGame, 
    startBotGame, 
    gameMode, 
    setGameMode, 
    boardTheme, 
    setBoardTheme,
    setRoomCode,
    setMyPlayerId,
    setPlayers,
    roomCode,
    players,
    startOnlineGame,
    setGameStarted
  } = useGame();

  // Screen state: 'landing' | 'menu' | 'local' | 'ai' | 'online_menu' | 'online_lobby' | 'online_join'
  const [subMode, setSubMode] = useState('landing'); 
  const [rulesOpen, setRulesOpen] = useState(false);
  
  // Local Pass & Play State
  const [localPlayers, setLocalPlayers] = useState([
    { name: 'Player 1', avatar: '🦊', color: 'mint' },
    { name: 'Player 2', avatar: '🐼', color: 'coral' }
  ]);
  
  // Bot/AI State
  const [humanPlayer, setHumanPlayer] = useState({ name: 'Player 1', avatar: '🦊', color: 'mint' });
  const [botCount, setBotCount] = useState(2);

  // Online Multiplayer State
  const [onlineName, setOnlineName] = useState('Host Player');
  const [onlineAvatar, setOnlineAvatar] = useState('🦊');
  const [selectedTokenKey, setSelectedTokenKey] = useState('mint');
  const [joinRoomCodeInput, setJoinRoomCodeInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle Local Game Start
  const handleStartLocal = () => {
    // Map custom colors and avatars
    setBoardTheme(boardTheme);
    const startCash = boardTheme === 'INDIAN_BUSINESS' ? 25000 : 1500;
    const mapped = localPlayers.map((p, idx) => ({
      id: `local_${idx}`,
      name: p.name,
      avatar: p.avatar,
      color: p.color,
      token: TOKEN_COLORS.findIndex(c => c.key === p.color),
      balance: startCash,
      position: 0,
      isBankrupt: false,
      inJail: false,
      jailTurns: 0,
      isHost: idx === 0,
      isBot: false
    }));

    // Re-initialize Context state
    setPlayers(mapped);
    setGameMode('local');
    // Start local context bypass startLocalGame to preserve avatars/colors
    window.location.hash = ''; // Clear hash just in case
    setGameStarted(true);
  };

  // Handle Bot Game Start
  const handleStartBot = () => {
    setBoardTheme(boardTheme);
    const startCash = boardTheme === 'INDIAN_BUSINESS' ? 25000 : 1500;
    const botNames = ['Chanakya AI', 'Vyapaar Bot', 'Kautilya AI', 'Rupee Bot'];
    const botAvatars = ['🤖', '💻', '👾', '🚀'];
    const botColors = ['coral', 'sun', 'sky', 'grape'];
    
    const initialPlayers = [
      {
        id: 'player_human',
        name: humanPlayer.name,
        avatar: humanPlayer.avatar,
        color: humanPlayer.color,
        token: TOKEN_COLORS.findIndex(c => c.key === humanPlayer.color),
        balance: startCash,
        position: 0,
        isBankrupt: false,
        inJail: false,
        jailTurns: 0,
        isHost: true,
        isBot: false
      }
    ];

    for (let i = 0; i < botCount; i++) {
      const colorKey = botColors[i % botColors.length];
      initialPlayers.push({
        id: `bot_${i}`,
        name: botNames[i % botNames.length],
        avatar: botAvatars[i % botAvatars.length],
        color: colorKey,
        token: TOKEN_COLORS.findIndex(c => c.key === colorKey),
        balance: startCash,
        position: 0,
        isBankrupt: false,
        inJail: false,
        jailTurns: 0,
        isHost: false,
        isBot: true
      });
    }

    setPlayers(initialPlayers);
    setGameMode('ai');
    setGameStarted(true);
  };

  // Handle Host Online Room
  const handleHostOnline = async () => {
    if (!onlineName.trim()) {
      setErrorMsg('Please enter a name');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    try {
      const generatedCode = Math.random().toString(36).substr(2, 6).toUpperCase();
      const tokenIdx = TOKEN_COLORS.findIndex(c => c.key === selectedTokenKey);
      
      // Inject avatar into player state
      const room = await createRoom(generatedCode, onlineName, tokenIdx, boardTheme);
      
      // Patch host info with our custom avatar and color
      const updatedPlayers = room.players.map(p => p.isHost ? {
        ...p,
        avatar: onlineAvatar,
        color: selectedTokenKey
      } : p);
      
      setRoomCode(generatedCode);
      setMyPlayerId(room.players[0].id);
      setPlayers(updatedPlayers);
      setGameMode('online');
      setSubMode('online_lobby');
    } catch (err) {
      setErrorMsg('Failed to create room. Using local fallback.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Join Online Room
  const handleJoinOnline = async () => {
    if (!onlineName.trim() || !joinRoomCodeInput.trim()) {
      setErrorMsg('Please enter both name and room code');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    try {
      const targetCode = joinRoomCodeInput.trim().toUpperCase();
      const tokenIdx = TOKEN_COLORS.findIndex(c => c.key === selectedTokenKey);
      const room = await joinRoom(targetCode, onlineName, tokenIdx);
      
      // Patch player properties
      const updatedPlayers = room.players.map(p => p.name === onlineName ? {
        ...p,
        avatar: onlineAvatar,
        color: selectedTokenKey
      } : p);

      setRoomCode(targetCode);
      const me = room.players.find(p => p.name === onlineName && p.token === tokenIdx);
      setMyPlayerId(me ? me.id : room.players[room.players.length - 1].id);
      setPlayers(updatedPlayers);
      setGameMode('online');
      setSubMode('online_lobby');
    } catch (err) {
      setErrorMsg(err.message || 'Room not found or game already started');
    } finally {
      setIsLoading(false);
    }
  };

  const addLocalPlayer = () => {
    if (localPlayers.length >= 6) return;
    const avatarsUsed = localPlayers.map(p => p.avatar);
    const nextAvatar = AVATARS.find(a => !avatarsUsed.includes(a)) || AVATARS[localPlayers.length];
    const colorsUsed = localPlayers.map(p => p.color);
    const nextColor = TOKEN_COLORS.find(c => !colorsUsed.includes(c.key))?.key || 'sun';
    
    setLocalPlayers([...localPlayers, { 
      name: `Player ${localPlayers.length + 1}`, 
      avatar: nextAvatar, 
      color: nextColor 
    }]);
  };

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col items-center select-none overflow-y-auto py-12 px-4 md:px-8">
      {/* 1. LANDING PAGE STATE */}
      {subMode === 'landing' && (
        <div className="max-w-5xl w-full flex flex-col items-center animate-pop pb-24">
          {/* Top Pill Logo Info */}
          <div className="chip mb-6 bg-[var(--sun)] text-ink font-bold gap-1.5 animate-bounce">
            <Sparkles className="w-3.5 h-3.5 fill-current" /> Season 1 · Live Arena
          </div>

          {/* Epic Brutalist Title */}
          <h1 className="font-display font-black text-center text-6xl md:text-8xl leading-none flex flex-col items-center">
            <span>META</span>
            <span
              className="inline-block px-6 py-2 my-2 rotate-[-2.5deg] animate-bob text-ink-soft"
              style={{ 
                background: "var(--mint)", 
                border: "3.5px solid var(--ink)", 
                borderRadius: 24, 
                boxShadow: "8px 8px 0 0 var(--ink)" 
              }}
            >
              BOARD
            </span>
            <span className="block text-xl md:text-3xl mt-4 font-extrabold text-ink-soft opacity-80">
              3D · Cozy Tycoon Arena
            </span>
          </h1>

          <p className="mt-8 max-w-xl text-center text-sm md:text-base leading-relaxed text-ink-soft">
            Buy properties, build colorful houses, roll bouncy 3D dice, and send your friends straight to jail! An Indian Business and International Countries Monopoly board built for quick fun.
          </p>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-wrap gap-4 justify-center">
            <button 
              onClick={() => setSubMode('menu')} 
              className="btn-brutal text-lg px-8 py-4 bg-[var(--mint)] text-ink"
            >
              <Play className="w-5 h-5 fill-current" /> Play Game
            </button>
            <button 
              onClick={() => setRulesOpen(true)} 
              className="btn-brutal text-lg px-8 py-4 bg-[var(--surface)]"
            >
              <BookOpen className="w-5 h-5" /> View Rules
            </button>
          </div>

          {/* Feature highlights */}
          <div className="mt-8 flex flex-wrap gap-2 justify-center">
            <div className="chip bg-[var(--surface)]"><Sparkles className="w-3.5 h-3.5" /> 3D Orbit Board</div>
            <div className="chip bg-[var(--surface)]"><Palette className="w-3.5 h-3.5" /> Two Local Themes</div>
            <div className="chip bg-[var(--surface)]"><Dice5 className="w-3.5 h-3.5" /> Simulated Dice</div>
          </div>

          {/* Cozy visual mode preview cards */}
          <div className="mt-16 grid md:grid-cols-3 gap-6 w-full max-w-4xl">
            {[
              { icon: Users, title: "Local Pass & Play", desc: "Pass and play turns locally on one screen", tint: "var(--mint)" },
              { icon: Bot,   title: "Vs Computer",       desc: "Battle against smart AI players", tint: "var(--sun)" },
              { icon: Globe, title: "Online Multiplayer",  desc: "Host or join lobbies with room codes", tint: "var(--sky)" },
            ].map((m, idx) => (
              <button
                key={m.title}
                onClick={() => {
                  setSubMode('menu');
                  if (idx === 0) setGameMode('local');
                  if (idx === 1) setGameMode('ai');
                  if (idx === 2) setSubMode('online_menu');
                }}
                className="brutal-lg p-6 text-left group hover:-translate-y-1 transition-transform cursor-pointer"
                style={{ background: "var(--surface)" }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: m.tint, border: "2.5px solid var(--ink)", boxShadow: "3.5px 3.5px 0 0 var(--ink)" }}
                >
                  <m.icon className="w-7 h-7" strokeWidth={2.5} />
                </div>
                <h3 className="font-display font-extrabold text-xl">{m.title}</h3>
                <p className="text-xs mt-1 text-ink-soft opacity-70 leading-relaxed">{m.desc}</p>
                <div className="mt-5 text-xs font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                  Launch mode →
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 2. GAME MODE SELECTION MENU */}
      {subMode === 'menu' && (
        <div className="max-w-xl w-full brutal-lg p-8 animate-pop mb-12" style={{ background: 'var(--surface)' }}>
          <div className="text-center mb-8">
            <h2 className="font-display font-black text-3xl">Choose Game Mode</h2>
            <p className="text-sm text-ink-soft opacity-70 mt-1">Configure your game session below</p>
          </div>

          <div className="grid grid-cols-1 gap-4 mb-6">
            <button
              onClick={() => setSubMode('local')}
              className="brutal p-5 text-left flex items-center gap-4 hover:-translate-y-0.5 transition-transform"
              style={{ background: 'var(--surface-2)' }}
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--mint)] flex items-center justify-center border-2 border-ink">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-display font-extrabold text-lg">Pass & Play</h4>
                <p className="text-xs text-ink-soft">Play locally on a single machine turn-by-turn</p>
              </div>
            </button>

            <button
              onClick={() => setSubMode('ai')}
              className="brutal p-5 text-left flex items-center gap-4 hover:-translate-y-0.5 transition-transform"
              style={{ background: 'var(--surface-2)' }}
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--sun)] flex items-center justify-center border-2 border-ink">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-display font-extrabold text-lg">Vs Computer</h4>
                <p className="text-xs text-ink-soft">Test your business skills against AI Opponents</p>
              </div>
            </button>

            <button
              onClick={() => setSubMode('online_menu')}
              className="brutal p-5 text-left flex items-center gap-4 hover:-translate-y-0.5 transition-transform"
              style={{ background: 'var(--surface-2)' }}
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--sky)] flex items-center justify-center border-2 border-ink">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-display font-extrabold text-lg">Play Online</h4>
                <p className="text-xs text-ink-soft">Create private rooms and play with friends online</p>
              </div>
            </button>
          </div>

          {/* Theme selection panel inside menu */}
          <div className="border-t-2 border-ink pt-6 mt-6">
            <h3 className="font-display font-extrabold text-lg mb-3 text-center">Board Edition</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'INDIAN_BUSINESS', title: '🇮🇳 Indian Business', sub: 'Rupees (₹) · Cities', tint: 'var(--sun)' },
                { id: 'INTERNATIONAL_COUNTRIES', title: '🌍 Countries Monopoly', sub: 'Dollars ($) · Countries', tint: 'var(--sky)' }
              ].map(theme => (
                <button
                  key={theme.id}
                  onClick={() => setBoardTheme(theme.id)}
                  className="w-full text-left p-4 rounded-xl border-2 transition-all cursor-pointer"
                  style={{
                    borderColor: 'var(--ink)',
                    background: boardTheme === theme.id ? theme.tint : 'var(--surface)',
                    boxShadow: boardTheme === theme.id ? '4px 4px 0 0 var(--ink)' : '2px 2px 0 0 var(--ink)',
                    transform: boardTheme === theme.id ? 'translate(-1px,-1px)' : 'none'
                  }}
                >
                  <div className="font-display font-black text-sm">{theme.title}</div>
                  <div className="text-[10px] opacity-75 mt-0.5 leading-tight">{theme.sub}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center mt-8">
            <button onClick={() => setSubMode('landing')} className="btn-brutal" style={{ background: 'var(--surface)' }}>
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </div>
        </div>
      )}

      {/* 3. LOCAL CONFIGURATION SCREEN */}
      {subMode === 'local' && (
        <div className="max-w-2xl w-full brutal-lg p-8 animate-pop mb-12" style={{ background: 'var(--surface)' }}>
          <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-ink">
            <button onClick={() => setSubMode('menu')} className="btn-brutal !p-2.5" style={{ background: 'var(--surface)' }}>
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="font-display font-black text-2xl">Local Setup</h2>
            <div className="chip bg-[var(--sun)]">Pass & Play</div>
          </div>

          <p className="text-xs text-ink-soft mb-6">Edition: {boardTheme === 'INDIAN_BUSINESS' ? 'Indian Business (₹)' : 'Countries Monopoly ($)'}</p>

          <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2">
            {localPlayers.map((player, idx) => (
              <div key={idx} className="brutal p-4 flex flex-col md:flex-row md:items-center gap-4" style={{ background: 'var(--surface-2)' }}>
                {/* Avatar and index */}
                <div className="flex items-center gap-3">
                  <span className="font-display font-black text-sm">#{idx + 1}</span>
                  <div 
                    className="w-12 h-12 rounded-xl border-2 border-ink flex items-center justify-center text-2xl relative"
                    style={{ background: `var(--${player.color})`, boxShadow: '3px 3px 0 0 var(--ink)' }}
                  >
                    {player.avatar}
                    {/* Cycle avatar button */}
                    <button 
                      onClick={() => {
                        const curIdx = AVATARS.indexOf(player.avatar);
                        const nextAvatar = AVATARS[(curIdx + 1) % AVATARS.length];
                        const updated = [...localPlayers];
                        updated[idx].avatar = nextAvatar;
                        setLocalPlayers(updated);
                      }}
                      className="absolute -bottom-1 -right-1 w-5 h-5 bg-white border border-ink rounded-full flex items-center justify-center text-[10px] cursor-pointer"
                      title="Next Avatar"
                    >
                      🎲
                    </button>
                  </div>
                </div>

                {/* Name Input */}
                <input
                  type="text"
                  value={player.name}
                  onChange={(e) => {
                    const updated = [...localPlayers];
                    updated[idx].name = e.target.value;
                    setLocalPlayers(updated);
                  }}
                  className="flex-1 font-display font-extrabold text-base bg-white border-2 border-ink rounded-xl px-3 py-2 outline-none"
                  placeholder="Player Name"
                />

                {/* Token Colors */}
                <div className="flex gap-1.5 flex-wrap">
                  {TOKEN_COLORS.map(c => {
                    const taken = localPlayers.some((pl, i) => i !== idx && pl.color === c.key);
                    const active = player.color === c.key;
                    return (
                      <button
                        key={c.key}
                        disabled={taken}
                        onClick={() => {
                          const updated = [...localPlayers];
                          updated[idx].color = c.key;
                          setLocalPlayers(updated);
                        }}
                        className="w-7 h-7 rounded-full transition-all border-2 border-ink"
                        style={{
                          background: c.hex,
                          opacity: taken ? 0.25 : 1,
                          transform: active ? 'scale(1.15)' : 'none',
                          boxShadow: active ? '0 0 0 2px var(--surface), 0 0 0 4px var(--ink)' : 'none'
                        }}
                        title={c.name}
                      />
                    );
                  })}
                </div>

                {/* Remove button */}
                {localPlayers.length > 2 && (
                  <button 
                    onClick={() => setLocalPlayers(localPlayers.filter((_, i) => i !== idx))}
                    className="p-2 rounded-lg hover:bg-[var(--coral)] border-2 border-ink cursor-pointer bg-white"
                    title="Remove Player"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-8">
            <button 
              onClick={addLocalPlayer} 
              disabled={localPlayers.length >= 6} 
              className="btn-brutal w-full md:w-auto bg-[var(--sun)]"
            >
              <Plus className="w-4 h-4" /> Add Player
            </button>
            <button 
              onClick={handleStartLocal} 
              className="btn-brutal w-full md:w-auto bg-[var(--mint)] px-10"
            >
              <Play className="w-5 h-5 fill-current" /> Start Game
            </button>
          </div>
        </div>
      )}

      {/* 4. AI VS BOT CONFIGURATION SCREEN */}
      {subMode === 'ai' && (
        <div className="max-w-xl w-full brutal-lg p-8 animate-pop mb-12" style={{ background: 'var(--surface)' }}>
          <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-ink">
            <button onClick={() => setSubMode('menu')} className="btn-brutal !p-2.5" style={{ background: 'var(--surface)' }}>
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="font-display font-black text-2xl">Vs Computer</h2>
            <div className="chip bg-[var(--sun)]">Bot Mode</div>
          </div>

          {/* Profile Name & Avatar */}
          <div className="brutal p-6 mb-6 space-y-4" style={{ background: 'var(--surface-2)' }}>
            <h3 className="font-display font-extrabold text-lg">Your Profile</h3>
            <div className="flex items-center gap-4">
              <div 
                className="w-16 h-16 rounded-2xl border-2 border-ink flex items-center justify-center text-4xl relative"
                style={{ background: `var(--${humanPlayer.color})`, boxShadow: '4px 4px 0 0 var(--ink)' }}
              >
                {humanPlayer.avatar}
                <button 
                  onClick={() => {
                    const curIdx = AVATARS.indexOf(humanPlayer.avatar);
                    const nextAvatar = AVATARS[(curIdx + 1) % AVATARS.length];
                    setHumanPlayer({ ...humanPlayer, avatar: nextAvatar });
                  }}
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-white border border-ink rounded-full flex items-center justify-center text-[12px] cursor-pointer"
                >
                  🎲
                </button>
              </div>

              <div className="flex-1 space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider">Username</label>
                <input
                  type="text"
                  value={humanPlayer.name}
                  onChange={(e) => setHumanPlayer({ ...humanPlayer, name: e.target.value })}
                  className="w-full font-display font-extrabold text-base bg-white border-2 border-ink rounded-xl px-3 py-2 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-center pt-2">
              {TOKEN_COLORS.map(c => (
                <button
                  key={c.key}
                  onClick={() => setHumanPlayer({ ...humanPlayer, color: c.key })}
                  className="w-8 h-8 rounded-full border-2 border-ink transition-transform"
                  style={{
                    background: c.hex,
                    transform: humanPlayer.color === c.key ? 'scale(1.15)' : 'none',
                    boxShadow: humanPlayer.color === c.key ? '0 0 0 2px var(--surface), 0 0 0 4px var(--ink)' : 'none'
                  }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Bot Count */}
          <div className="brutal p-6 mb-8" style={{ background: 'var(--surface-2)' }}>
            <h3 className="font-display font-extrabold text-base mb-4">Number of Bot Opponents</h3>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map(num => (
                <button
                  key={num}
                  onClick={() => setBotCount(num)}
                  className="p-3 border-2 border-ink rounded-xl font-display font-black text-lg cursor-pointer transition-all"
                  style={{
                    background: botCount === num ? 'var(--mint)' : 'var(--surface)',
                    boxShadow: botCount === num ? '4px 4px 0 0 var(--ink)' : '2px 2px 0 0 var(--ink)',
                    transform: botCount === num ? 'translate(-1px,-1px)' : 'none'
                  }}
                >
                  {num} Bot{num > 1 ? 's' : ''}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={handleStartBot} 
            className="btn-brutal w-full bg-[var(--mint)] text-lg py-4"
          >
            <Play className="w-5 h-5 fill-current" /> Start Bot Battle
          </button>
        </div>
      )}

      {/* 5. ONLINE MULTIPLAYER MENU */}
      {subMode === 'online_menu' && (
        <div className="max-w-xl w-full brutal-lg p-8 animate-pop mb-12" style={{ background: 'var(--surface)' }}>
          <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-ink">
            <button onClick={() => setSubMode('menu')} className="btn-brutal !p-2.5" style={{ background: 'var(--surface)' }}>
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="font-display font-black text-2xl">Online Multiplayer</h2>
            <div className="chip bg-[var(--sky)]">Online</div>
          </div>

          {!isSupabaseConfigured && (
            <div className="p-4 mb-6 border-2 border-ink rounded-xl bg-[var(--sky)] flex items-start gap-3">
              <span className="text-2xl mt-0.5">💡</span>
              <p className="text-xs text-ink leading-relaxed">
                Supabase credentials not configured. Running in <strong>LocalSync Mode</strong>. You can instantly test multiplayer by opening this game in multiple tabs on this browser!
              </p>
            </div>
          )}

          {/* User Profile */}
          <div className="brutal p-6 mb-6 space-y-4" style={{ background: 'var(--surface-2)' }}>
            <h3 className="font-display font-extrabold text-lg">Your Player Info</h3>
            <div className="flex items-center gap-4">
              <div 
                className="w-16 h-16 rounded-2xl border-2 border-ink flex items-center justify-center text-4xl relative"
                style={{ background: `var(--${selectedTokenKey})`, boxShadow: '4px 4px 0 0 var(--ink)' }}
              >
                {onlineAvatar}
                <button 
                  onClick={() => {
                    const curIdx = AVATARS.indexOf(onlineAvatar);
                    const nextAvatar = AVATARS[(curIdx + 1) % AVATARS.length];
                    setOnlineAvatar(nextAvatar);
                  }}
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-white border border-ink rounded-full flex items-center justify-center text-[12px] cursor-pointer"
                >
                  🎲
                </button>
              </div>

              <div className="flex-1 space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider">Username</label>
                <input
                  type="text"
                  value={onlineName}
                  onChange={(e) => setOnlineName(e.target.value)}
                  className="w-full font-display font-extrabold text-base bg-white border-2 border-ink rounded-xl px-3 py-2 outline-none"
                  placeholder="Enter Username"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-center pt-2">
              {TOKEN_COLORS.map(c => (
                <button
                  key={c.key}
                  onClick={() => setSelectedTokenKey(c.key)}
                  className="w-8 h-8 rounded-full border-2 border-ink transition-transform"
                  style={{
                    background: c.hex,
                    transform: selectedTokenKey === c.key ? 'scale(1.15)' : 'none',
                    boxShadow: selectedTokenKey === c.key ? '0 0 0 2px var(--surface), 0 0 0 4px var(--ink)' : 'none'
                  }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {errorMsg && <p className="text-sm font-bold text-[var(--coral)] text-center mb-4">⚠️ {errorMsg}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={handleHostOnline} 
              disabled={isLoading || !onlineName.trim()} 
              className="btn-brutal bg-[var(--mint)] py-4 text-base"
            >
              {isLoading ? 'Creating Room...' : 'Host Room'}
            </button>
            <button 
              onClick={() => setSubMode('online_join')} 
              disabled={isLoading || !onlineName.trim()} 
              className="btn-brutal bg-[var(--sun)] py-4 text-base"
            >
              Join Room Code
            </button>
          </div>
        </div>
      )}

      {/* 6. JOIN ONLINE ROOM INPUT */}
      {subMode === 'online_join' && (
        <div className="max-w-md w-full brutal-lg p-8 animate-pop mb-12" style={{ background: 'var(--surface)' }}>
          <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-ink">
            <button onClick={() => setSubMode('online_menu')} className="btn-brutal !p-2.5" style={{ background: 'var(--surface)' }}>
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="font-display font-black text-xl">Enter Room Code</h2>
          </div>

          <div className="space-y-4 mb-6">
            <label className="text-xs font-bold uppercase tracking-wider text-center block">6-digit room identifier</label>
            <input
              type="text"
              value={joinRoomCodeInput}
              onChange={(e) => setJoinRoomCodeInput(e.target.value.toUpperCase())}
              className="w-full font-display font-black text-2xl tracking-widest text-center bg-white border-2 border-ink rounded-xl py-3 outline-none"
              maxLength={6}
              placeholder="e.g. XJ79KL"
            />
          </div>

          {errorMsg && <p className="text-sm font-bold text-[var(--coral)] text-center mb-4">⚠️ {errorMsg}</p>}

          <button
            onClick={handleJoinOnline}
            disabled={isLoading || joinRoomCodeInput.trim().length !== 6}
            className="btn-brutal w-full bg-[var(--mint)] py-4 text-lg"
          >
            {isLoading ? 'Joining...' : 'Connect to Lobby'}
          </button>
        </div>
      )}

      {/* 7. ONLINE multiplayer WAITING LOBBY */}
      {subMode === 'online_lobby' && (
        <div className="max-w-xl w-full brutal-lg p-8 animate-pop mb-12" style={{ background: 'var(--surface)' }}>
          <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-ink">
            <h2 className="font-display font-black text-2xl">Lobby Code: <span className="text-[var(--sky)] tracking-widest">{roomCode}</span></h2>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(roomCode);
              }}
              className="btn-brutal !p-2 bg-[var(--sun)]"
              title="Copy Room Code"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-ink-soft mb-6">Waiting for friends to join using the code above...</p>

          <div className="space-y-3 mb-8 max-h-[300px] overflow-y-auto pr-1">
            <h3 className="text-xs font-bold uppercase tracking-wider mb-2">Players Connected ({players.length}/4)</h3>
            {players.map((p, idx) => (
              <div key={p.id || idx} className="brutal p-4 flex items-center justify-between" style={{ background: 'var(--surface-2)' }}>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg border-2 border-ink flex items-center justify-center text-xl"
                    style={{ background: `var(--${p.color || 'mint'})` }}
                  >
                    {p.avatar || '🦊'}
                  </div>
                  <span className="font-display font-black text-base">{p.name} {p.isHost && '👑'}</span>
                </div>
                <span className="chip text-[10px]" style={{ background: idx === 0 ? 'var(--mint)' : 'var(--sun)' }}>
                  {idx === 0 ? 'Host' : 'Ready'}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center gap-4">
            <button 
              onClick={() => {
                setSubMode('online_menu');
                setRoomCode('');
              }} 
              className="btn-brutal bg-[var(--surface)]"
            >
              Leave Room
            </button>

            {players.length > 0 && players[0].name === onlineName ? (
              <button 
                onClick={startOnlineGame} 
                className="btn-brutal bg-[var(--mint)] px-8"
                disabled={players.length < 2}
              >
                <Play className="w-4 h-4 fill-current" /> Start Match
              </button>
            ) : (
              <div className="text-xs font-bold text-[var(--sky)] animate-pulse">Waiting for host to launch game...</div>
            )}
          </div>
        </div>
      )}

      {/* Rules Modal 2D */}
      <RulesModal2D open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </div>
  );
}
