import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { BOARD_THEMES } from '../utils/gameRules';
import { 
  Dice5, 
  Home, 
  Coins, 
  Flag, 
  AlertTriangle, 
  KeyRound, 
  BedDouble, 
  Sun, 
  BookOpen, 
  Crown, 
  X, 
  Building2, 
  ScrollText, 
  Lock, 
  Layers3, 
  Plus, 
  Home as HomeIcon, 
  Hotel,
  Settings 
} from "lucide-react";
import RulesModal from './RulesModal';
import PortfolioDrawer from './PortfolioDrawer';

const TOKEN_COLORS = [
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#8b5cf6', // Grape
  '#f43f5e'  // Rose
];

export default function GameHUD() {
  const {
    boardTheme,
    gameMode,
    players,
    turnIndex,
    boardSpaces,
    dice,
    isDiceRolled,
    diceRolling,
    logs,
    winner,
    drawnCard,
    setDrawnCard,
    selectedProperty,
    setSelectedProperty,
    rollDice,
    buyProperty,
    buildHouse,
    mortgageProperty,
    unmortgageProperty,
    declareBankruptcy,
    endTurn,
    myPlayerId,
    pawnMoving,
    // new actions
    payJailFine,
    useJailCard,
    wakeUpAndEndTurn
  } = useGame();

  const [rulesOpen, setRulesOpen] = useState(false);
  const [portfolioPlayer, setPortfolioPlayer] = useState(null);

  const isIndian = boardTheme === BOARD_THEMES.INDIAN_BUSINESS;
  const symbol = isIndian ? '₹' : '$';

  // Find active player
  const activePlayer = players[turnIndex];

  // Check if it's MY turn
  const isMyTurn = gameMode !== 'online' ? (!activePlayer?.isBot) : (activePlayer?.id === myPlayerId);

  // Group properties owned by player
  const getPlayerProperties = (playerId) => {
    return boardSpaces.filter(s => s.ownerId === playerId);
  };

  const formatMoney = (val) => {
    return `${symbol}${val.toLocaleString()}`;
  };

  // Helper to parse log strings into structured visual entries
  const parseLog = (logText, index) => {
    let kind = 'info';
    let emoji = '✨';
    if (logText.includes('rolled') || logText.includes('dice') || logText.includes('Double')) {
      kind = 'roll';
      emoji = '🎲';
    } else if (logText.includes('bought') || logText.includes('purchased') || logText.includes('built') || logText.includes('Hotel')) {
      kind = 'buy';
      emoji = '🏠';
    } else if (logText.includes('paid rent') || logText.includes('Paid rent') || logText.includes('Tax') || logText.includes('fine') || logText.includes('Fine')) {
      kind = 'pay';
      emoji = '💸';
    } else if (logText.includes('Jail') || logText.includes('jail') || logText.includes('Rest House') || logText.includes('woke up')) {
      kind = 'jail';
      emoji = '🚓';
    } else if (logText.includes('Card') || logText.includes('Chance') || logText.includes('Community') || logText.includes('Draw')) {
      kind = 'card';
      emoji = '🃏';
    }
    
    // Extract first word as possible timestamp
    return {
      id: `log_${index}`,
      kind,
      emoji,
      text: logText,
      time: index === 0 ? 'now' : `${index}m ago`
    };
  };

  // Log kind style classes
  const getLogKindBg = (kind) => {
    const styles = {
      buy: "bg-[var(--mint)]",
      pay: "bg-[var(--coral)]",
      roll: "bg-[var(--sun)]",
      card: "bg-[var(--grape)] text-ink",
      jail: "bg-[var(--rose)]",
      info: "bg-[var(--sky)]"
    };
    return styles[kind] || "bg-[var(--surface-2)]";
  };

  // Game state console modes
  let consoleMode = 'normal';
  if (activePlayer) {
    if (activePlayer.inJail) {
      consoleMode = 'jail';
    } else if (activePlayer.jailTurns > 0) {
      consoleMode = 'resting';
    }
  }

  // Card overlay emojis
  const getCardEmoji = (text) => {
    if (text.includes('START') || text.includes('salary')) return '🚗';
    if (text.includes('Fine') || text.includes('penalty') || text.includes('bill') || text.includes('fee')) return '💸';
    if (text.includes('Jail') || text.includes('JAIL')) return '🚓';
    if (text.includes('Jackpot') || text.includes('bonus') || text.includes('winnings') || text.includes('refund') || text.includes('interest')) return '💎';
    if (text.includes('repair')) return '🔧';
    if (text.includes('Birthday') || text.includes('Gift') || text.includes('Opera')) return '🎁';
    if (text.includes('Transport') || text.includes('Fly')) return '🚂';
    if (text.includes('Out of Jail Free')) return '🔓';
    return '🃏';
  };

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none flex flex-col justify-between p-4 select-none">
      {/* 1. TOP BRAND BAR */}
      <header className="w-full flex items-center justify-between px-5 py-3 brutal bg-[var(--surface)] pointer-events-auto rounded-2xl z-10">
        <div className="flex items-center gap-2">
          <span className="font-display font-black text-xl flex items-center gap-1.5 text-ink">
            🎲 META<span className="px-2 py-0.5 border-2 border-ink rounded-lg bg-[var(--mint)]">BOARD</span>
          </span>
          <span className="hidden md:inline text-xs font-bold opacity-60 ml-2">
            {isIndian ? '🇮🇳 Indian Business' : '🌍 Countries Monopoly'}
          </span>
        </div>

        {/* Dice visualizer */}
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <div className="w-10 h-10 rounded-xl border-2 border-ink bg-white text-ink font-black text-lg flex items-center justify-center shadow-brutal-sm" style={{ boxShadow: '2px 2px 0 0 var(--ink)' }}>
              {dice[0]}
            </div>
            <div className="w-10 h-10 rounded-xl border-2 border-ink bg-white text-ink font-black text-lg flex items-center justify-center shadow-brutal-sm" style={{ boxShadow: '2px 2px 0 0 var(--ink)' }}>
              {dice[1]}
            </div>
          </div>
          <div className="chip bg-[var(--sun)] text-ink font-black py-1 px-3">
            Total: {dice[0] + dice[1]}
          </div>
        </div>

        {/* Actions header */}
        <div className="flex gap-2">
          <button onClick={() => setRulesOpen(true)} className="chip bg-[var(--surface-2)] cursor-pointer hover:bg-[var(--surface)] py-1.5 px-3">
            <BookOpen className="w-3.5 h-3.5" /> Rules
          </button>
          <button onClick={() => window.location.reload()} className="chip bg-[var(--surface-2)] cursor-pointer hover:bg-[var(--surface)] py-1.5 px-3">
            <Settings className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      </header>

      {/* 2. MIDDLE VIEWPORT LAYOUT */}
      <div className="flex-1 w-full flex justify-between my-4 overflow-hidden z-10">
        {/* LEFT LEADERBOARD */}
        <aside className="w-[280px] hidden md:flex flex-col p-4 brutal bg-[var(--surface)] pointer-events-auto rounded-2xl overflow-y-auto space-y-3">
          <div className="flex items-center justify-between pb-2 border-b-2 border-ink">
            <h2 className="font-display font-black text-lg text-ink flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-500 fill-current" /> Tycoons
            </h2>
            <span className="chip bg-[var(--surface-2)] text-[10px] py-0.5 px-2">Turn Active</span>
          </div>

          <div className="space-y-3 overflow-y-auto flex-1 pr-1">
            {players.map((p, idx) => {
              const isActive = idx === turnIndex;
              const propertiesOwned = getPlayerProperties(p.id);
              const pColor = p.color ? `var(--${p.color})` : TOKEN_COLORS[p.token % TOKEN_COLORS.length];
              
              return (
                <button
                  key={p.id}
                  onClick={() => setPortfolioPlayer(p)}
                  className="w-full text-left brutal p-3 transition-all hover:-translate-y-0.5 cursor-pointer"
                  style={{
                    background: p.isBankrupt ? "var(--surface-2)" : "var(--surface)",
                    opacity: p.isBankrupt ? 0.6 : 1,
                    animation: isActive && !p.isBankrupt ? "glow 2s ease-in-out infinite" : undefined,
                    borderColor: "var(--ink)"
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl border-2 border-ink flex-shrink-0 relative"
                      style={{ background: pColor, boxShadow: "2px 2px 0 0 var(--ink)" }}
                    >
                      {p.avatar || '🦊'}
                      {isActive && !p.isBankrupt && (
                        <span
                          className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full"
                          style={{ background: "var(--mint)", border: "2px solid var(--ink)" }}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <div className="font-display font-extrabold text-sm truncate text-ink">{p.name} {p.isBot && '🤖'}</div>
                        {p.inJail && (
                          <span className="chip !px-1.5 !py-0 !text-[8px] bg-[var(--coral)] text-ink">
                            <Lock className="w-2.5 h-2.5" /> JAIL
                          </span>
                        )}
                        {p.isBankrupt && (
                          <span className="chip !px-1.5 !py-0 !text-[8px] bg-zinc-700 text-white">
                            OUT
                          </span>
                        )}
                        {p.jailTurns > 0 && !p.inJail && (
                          <span className="chip !px-1.5 !py-0 !text-[8px] bg-[var(--sky)] text-ink">
                            REST
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1">
                        <div className="price-tag !py-0.5 !px-2 !text-xs font-display font-black text-ink">
                          {formatMoney(p.balance)}
                        </div>
                      </div>
                      <div className="text-[10px] font-bold mt-1 text-ink-soft opacity-75 flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> {propertiesOwned.length} properties
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* RIGHT LIVE FEED */}
        <aside className="w-[300px] hidden md:flex flex-col p-4 brutal bg-[var(--surface)] pointer-events-auto rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-ink">
            <h2 className="font-display font-black text-lg text-ink flex items-center gap-2">
              <ScrollText className="w-4.5 h-4.5" /> Live Feed
            </h2>
            <span className="chip bg-[var(--surface-2)] text-[10px] font-black">{logs.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {logs.map((logStr, i) => {
              const entry = parseLog(logStr, i);
              const alignRight = entry.kind === 'pay' || entry.kind === 'card';
              
              return (
                <div
                  key={entry.id}
                  className={`flex ${alignRight ? "justify-end" : "justify-start"}`}
                  style={{ animation: `bubble .35s ${Math.min(i * 0.05, 0.5)}s both` }}
                >
                  <div
                    className="max-w-[90%] p-2.5 rounded-2xl relative border-2 border-ink text-ink font-semibold"
                    style={{
                      background: getLogKindBg(entry.kind).replace('bg-[', '').replace(']', ''),
                      boxShadow: "2.5px 2.5px 0 0 var(--ink)",
                      borderBottomLeftRadius: !alignRight ? 4 : undefined,
                      borderBottomRightRadius: alignRight ? 4 : undefined,
                    }}
                  >
                    <div className="flex items-start gap-1.5">
                      <span className="text-lg leading-none">{entry.emoji}</span>
                      <div className="flex-1">
                        <div className="text-[11px] leading-snug">{entry.text}</div>
                        <div className="text-[9px] mt-0.5 font-bold opacity-60">{entry.time}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </div>

      {/* 3. BOTTOM PANEL CONSOLE */}
      {activePlayer && (
        <footer className="w-full brutal-lg p-4 flex flex-col md:flex-row items-center gap-4 bg-[var(--surface)] pointer-events-auto rounded-2xl z-10">
          {/* Active Turn Info */}
          <div className="flex items-center gap-4 pr-4 border-r-2 border-ink flex-shrink-0">
            <div
              className="w-12 h-12 rounded-xl border-2 border-ink flex items-center justify-center text-2xl flex-shrink-0"
              style={{ 
                background: activePlayer.color ? `var(--${activePlayer.color})` : TOKEN_COLORS[activePlayer.token % TOKEN_COLORS.length], 
                boxShadow: "2.5px 2.5px 0 0 var(--ink)" 
              }}
            >
              {activePlayer.avatar || '🦊'}
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-wider font-black text-ink-soft opacity-60 leading-none">
                Now Playing
              </div>
              <div className="font-display font-black text-base text-ink mt-0.5 leading-tight">
                {activePlayer.name}'s turn {activePlayer.isBot && '🤖'}
              </div>
              <div className="text-[10px] text-ink-soft font-semibold leading-none mt-1">
                Landed: {boardSpaces[activePlayer.position]?.name || `Space ${activePlayer.position}`}
              </div>
            </div>
          </div>

          {/* Action buttons list */}
          <div className="flex-1 flex flex-wrap items-center gap-2.5 w-full">
            {isMyTurn ? (
              <>
                {/* 3A. NORMAL STATE */}
                {consoleMode === 'normal' && (
                  <>
                    {!isDiceRolled && !diceRolling && !pawnMoving && (
                      <button onClick={rollDice} className="btn-brutal bg-[var(--mint)] text-ink">
                        <Dice5 className="w-4 h-4 fill-current" /> Roll Dice
                      </button>
                    )}

                    {diceRolling && (
                      <button className="btn-brutal bg-[var(--sun)] text-ink" disabled>
                        🌀 Rolling Dice...
                      </button>
                    )}

                    {pawnMoving && (
                      <button className="btn-brutal bg-[var(--sky)] text-ink" disabled>
                        🏃 Moving Pawn...
                      </button>
                    )}

                    {isDiceRolled && !pawnMoving && (
                      <>
                        {/* Buy options */}
                        {(() => {
                          const space = boardSpaces[activePlayer.position];
                          if (space && !space.ownerId && (space.type === 'property' || space.type === 'transport' || space.type === 'utility')) {
                            const canAfford = activePlayer.balance >= space.cost;
                            return (
                              <button 
                                onClick={buyProperty} 
                                className="btn-brutal bg-[var(--sun)] text-ink" 
                                disabled={!canAfford}
                              >
                                <Home className="w-4 h-4 fill-current" /> Buy {space.name} ({formatMoney(space.cost)})
                              </button>
                            );
                          }
                          return null;
                        })()}

                        <button onClick={() => endTurn()} className="btn-brutal bg-[var(--surface-2)] text-ink">
                          <Flag className="w-4 h-4" /> End Turn
                        </button>
                      </>
                    )}

                    {/* Portfolio overview */}
                    <button onClick={() => setPortfolioPlayer(activePlayer)} className="btn-brutal bg-[var(--sky)] text-ink">
                      <Coins className="w-4 h-4" /> My Portfolio
                    </button>
                  </>
                )}

                {/* 3B. JAIL STATE */}
                {consoleMode === 'jail' && (
                  <>
                    <div className="chip bg-[var(--coral)] text-ink font-bold text-xs py-2 px-3">
                      🚓 You are in JAIL (turns left: {activePlayer.jailTurns})
                    </div>
                    
                    {/* Pay Fine */}
                    <button 
                      onClick={payJailFine} 
                      disabled={activePlayer.balance < (isIndian ? 500 : 50)} 
                      className="btn-brutal bg-[var(--sun)] text-ink"
                    >
                      <Coins className="w-4 h-4" /> Pay Release Fine ({isIndian ? '₹500' : '$50'})
                    </button>

                    {/* Use Card */}
                    <button 
                      onClick={useJailCard} 
                      disabled={!activePlayer.hasJailCard} 
                      className="btn-brutal bg-[var(--grape)] text-ink"
                    >
                      <KeyRound className="w-4 h-4" /> Use Escape Card
                    </button>

                    {/* Roll for doubles */}
                    {!isDiceRolled && !diceRolling && !pawnMoving && (
                      <button onClick={rollDice} className="btn-brutal bg-[var(--mint)] text-ink">
                        <Dice5 className="w-4 h-4" /> Roll for Doubles
                      </button>
                    )}

                    {isDiceRolled && !pawnMoving && (
                      <button onClick={() => endTurn()} className="btn-brutal bg-[var(--surface-2)] text-ink">
                        <Flag className="w-4 h-4" /> End Turn
                      </button>
                    )}

                    {diceRolling && (
                      <button className="btn-brutal bg-[var(--surface-2)]" disabled>
                        🌀 Rolling...
                      </button>
                    )}
                  </>
                )}

                {/* 3C. RESTING STATE */}
                {consoleMode === 'resting' && (
                  <>
                    <div className="chip bg-[var(--sky)] text-ink font-bold text-xs py-2 px-3">
                      <BedDouble className="w-4 h-4 text-ink" /> Resting at Rest House
                    </div>
                    <button onClick={wakeUpAndEndTurn} className="btn-brutal bg-[var(--sun)] text-ink">
                      <Sun className="w-4 h-4" /> Wake Up & End Turn
                    </button>
                  </>
                )}

                {/* Bankruptcy option if in debt */}
                {activePlayer.balance < 0 && (
                  <button onClick={declareBankruptcy} className="btn-brutal bg-[var(--coral)] text-ink ml-auto">
                    <AlertTriangle className="w-4 h-4" /> Declare Bankruptcy
                  </button>
                )}
              </>
            ) : (
              <div className="font-display font-extrabold text-sm text-ink-soft opacity-60 italic ml-2">
                Waiting for {activePlayer.name} to make their move...
              </div>
            )}
          </div>
        </footer>
      )}

      {/* 4. CHANCE / COMMUNITY CHEST CARD DRAW OVERLAY */}
      {drawnCard && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-auto"
          style={{ 
            background: "color-mix(in oklab, var(--ink) 50%, transparent)",
            animation: "pop 0.3s ease-out"
          }}
          onClick={() => setDrawnCard(null)}
        >
          <div
            className="w-[300px] h-[400px] rounded-3xl p-6 flex flex-col justify-between border-3 border-ink"
            style={{
              background: drawnCard.type === 'chance' ? 'var(--sun)' : 'var(--sky)',
              boxShadow: '10px 10px 0 0 var(--ink)',
              animation: 'bob 3s ease-in-out infinite'
            }}
            onClick={(e) => { e.stopPropagation(); setDrawnCard(null); }}
          >
            <div className="flex items-center justify-between pb-3 border-b-2 border-ink">
              <span className="font-display font-black text-sm tracking-wider uppercase text-ink">
                {drawnCard.type === 'chance' ? 'Chance' : 'Community'}
              </span>
              <span className="text-[10px] font-bold opacity-60">Tap to close</span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center my-4">
              <div className="text-7xl mb-4">
                {getCardEmoji(drawnCard.card.text)}
              </div>
              <div className="font-display font-extrabold text-lg text-ink leading-snug">
                {drawnCard.card.text}
              </div>
            </div>

            <div className="border-t-2 border-ink pt-3 text-center text-[10px] font-bold opacity-60">
              {isIndian ? 'Vyapaar Rules' : 'Monopoly Rules'}
            </div>
          </div>
        </div>
      )}

      {/* 5. PROPERTY DETAIL CARD MODAL */}
      {selectedProperty && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-auto"
          style={{ 
            background: "color-mix(in oklab, var(--ink) 45%, transparent)",
            animation: "pop 0.25s ease-out"
          }}
          onClick={() => setSelectedProperty(null)}
        >
          <div 
            className="brutal-lg max-w-sm w-full overflow-hidden flex flex-col pointer-events-auto" 
            style={{ background: 'var(--surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Color Band */}
            <div 
              className="p-5 text-center border-b-2 border-ink flex flex-col items-center" 
              style={{ 
                backgroundColor: selectedProperty.group 
                  ? `var(--prop-${selectedProperty.group})` 
                  : '#a0aec0' 
              }}
            >
              <h3 className="font-display font-black text-xl text-ink leading-tight">
                {selectedProperty.name}
              </h3>
              <span className="chip !text-[9px] !px-2 !py-0.5 mt-2 bg-white text-ink uppercase tracking-wider font-bold">
                {selectedProperty.type.toUpperCase()}
              </span>
            </div>

            {/* Body Info */}
            <div className="p-6 flex-1 space-y-4">
              {/* Properties rent specs */}
              {selectedProperty.type === 'property' && (
                <div className="space-y-2 text-xs font-bold text-ink">
                  <div className="flex justify-between"><span>Base Rent:</span><span>{formatMoney(selectedProperty.rent[0])}</span></div>
                  <div className="flex justify-between"><span>With 1 House:</span><span>{formatMoney(selectedProperty.rent[1])}</span></div>
                  <div className="flex justify-between"><span>With 2 Houses:</span><span>{formatMoney(selectedProperty.rent[2])}</span></div>
                  <div className="flex justify-between"><span>With 3 Houses:</span><span>{formatMoney(selectedProperty.rent[3])}</span></div>
                  <div className="flex justify-between"><span>With 4 Houses:</span><span>{formatMoney(selectedProperty.rent[4])}</span></div>
                  <div className="flex justify-between text-rose-600"><span>With HOTEL:</span><span>{formatMoney(selectedProperty.rent[5])}</span></div>
                  
                  <div className="border-t border-dashed border-ink pt-2 mt-2 flex justify-between text-ink-soft">
                    <span>House Cost:</span>
                    <span>{formatMoney(selectedProperty.houseCost)} each</span>
                  </div>
                </div>
              )}

              {selectedProperty.type === 'transport' && (
                <div className="space-y-2 text-xs font-bold text-ink">
                  <p className="opacity-70 text-[10px] leading-relaxed mb-2">
                    Rent scales with the number of Transport lines owned by the tycoon (1: 1x, 2: 2x, 3: 4x, 4: 8x base rent).
                  </p>
                  <div className="flex justify-between"><span>1 Line Owned:</span><span>{formatMoney(isIndian ? 1000 : 50)}</span></div>
                  <div className="flex justify-between"><span>2 Lines Owned:</span><span>{formatMoney(isIndian ? 2000 : 100)}</span></div>
                  <div className="flex justify-between"><span>3 Lines Owned:</span><span>{formatMoney(isIndian ? 4000 : 200)}</span></div>
                  <div className="flex justify-between"><span>4 Lines Owned:</span><span>{formatMoney(isIndian ? 8000 : 400)}</span></div>
                </div>
              )}

              {selectedProperty.type === 'utility' && (
                <div className="space-y-2 text-xs font-bold text-ink">
                  <p className="opacity-70 text-[10px] leading-relaxed">
                    Rent scales with dice roll: If 1 utility is owned, rent is 4x the dice value. If both utilities are owned, rent is 10x the dice value.
                  </p>
                </div>
              )}

              {/* Owner details */}
              <div className="border-t-2 border-ink pt-4 mt-4">
                {selectedProperty.ownerId ? (
                  <div className="chip bg-[var(--mint)] w-full justify-center py-2">
                    Owned by: <strong>{players.find(p => p.id === selectedProperty.ownerId)?.name || 'Bank'}</strong>
                    {selectedProperty.isMortgaged && (
                      <span className="text-[var(--coral)] ml-1 font-extrabold">(MORTGAGED)</span>
                    )}
                  </div>
                ) : (
                  <div className="chip bg-zinc-200 text-ink w-full justify-center py-2">
                    Bank Owned · Available for {formatMoney(selectedProperty.cost)}
                  </div>
                )}
              </div>

              {/* Developer Actions */}
              {selectedProperty.ownerId && (
                <div className="space-y-2 pt-2">
                  {/* Build House */}
                  {selectedProperty.type === 'property' && selectedProperty.houses < 5 && !selectedProperty.isMortgaged && (
                    <button 
                      onClick={() => buildHouse(selectedProperty.id)}
                      className="btn-brutal w-full text-xs py-2 bg-[var(--mint)]"
                      disabled={!isMyTurn || activePlayer?.balance < selectedProperty.houseCost}
                    >
                      <Plus className="w-3.5 h-3.5" /> Build {selectedProperty.houses === 4 ? 'Hotel' : 'House'} ({formatMoney(selectedProperty.houseCost)})
                    </button>
                  )}

                  {/* Mortgage */}
                  {!selectedProperty.isMortgaged && selectedProperty.houses === 0 && (
                    <button 
                      onClick={() => mortgageProperty(selectedProperty.id)}
                      className="btn-brutal w-full text-xs py-2 bg-[var(--coral)]"
                      disabled={!isMyTurn}
                    >
                      <Lock className="w-3.5 h-3.5" /> Mortgage (+{formatMoney(selectedProperty.mortgageValue)})
                    </button>
                  )}

                  {/* Unmortgage */}
                  {selectedProperty.isMortgaged && (
                    <button 
                      onClick={() => unmortgageProperty(selectedProperty.id)}
                      className="btn-brutal w-full text-xs py-2 bg-[var(--mint)]"
                      disabled={!isMyTurn || activePlayer?.balance < Math.round(selectedProperty.mortgageValue * 1.1)}
                    >
                      🔓 Unmortgage (-{formatMoney(Math.round(selectedProperty.mortgageValue * 1.1))})
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Footer close */}
            <div className="p-5 bg-[var(--surface-2)] text-center border-t-2 border-ink">
              <button onClick={() => setSelectedProperty(null)} className="btn-brutal w-full bg-[var(--surface)] text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. GAME OVER WINNER CARD */}
      {winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-auto" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="brutal-lg max-w-sm w-full p-8 text-center bg-[var(--surface)] animate-pop" style={{ boxShadow: '12px 12px 0 0 var(--ink)' }}>
            <span className="text-7xl block animate-bounce">🏆</span>
            <h1 className="font-display font-black text-3xl text-ink mt-4">VICTORY!</h1>
            <p className="text-base text-ink-soft mt-3 font-semibold">
              <strong>{winner.name}</strong> is the ultimate business tycoon!
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="btn-brutal w-full mt-6 bg-[var(--mint)] py-3 text-lg"
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* 7. RULES MODAL OVERLAY */}
      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />

      {/* 8. PROPERTY PORTFOLIO DRAWER */}
      <PortfolioDrawer 
        player={portfolioPlayer} 
        properties={boardSpaces} 
        currencySymbol={symbol} 
        onClose={() => setPortfolioPlayer(null)} 
      />
    </div>
  );
}
