import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  INDIAN_BUSINESS_BOARD, 
  INTERNATIONAL_COUNTRIES_BOARD, 
  CHANCE_CARDS, 
  COMMUNITY_CARDS, 
  calculateRent, 
  makeBotDecision 
} from '../utils/gameRules';
import { syncRoomState, mockRealtime, isSupabaseConfigured, supabase } from '../utils/supabaseClient';
import confetti from 'canvas-confetti';

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
  // Lobby States
  const [gameStarted, setGameStarted] = useState(false);
  const [gameMode, setGameMode] = useState('local'); // 'local' | 'ai' | 'online'
  const [boardTheme, setBoardTheme] = useState('INDIAN_BUSINESS');
  const [roomCode, setRoomCode] = useState('');
  const [myPlayerId, setMyPlayerId] = useState(null);

  // Core Game State
  const [players, setPlayers] = useState([]);
  const [turnIndex, setTurnIndex] = useState(0);
  const [boardSpaces, setBoardSpaces] = useState([]);
  const [dice, setDice] = useState([1, 1]);
  const [isDiceRolled, setIsDiceRolled] = useState(false);
  const [diceRolling, setDiceRolling] = useState(false);
  const [doubleCount, setDoubleCount] = useState(0);
  const [logs, setLogs] = useState([]);
  const [winner, setWinner] = useState(null);

  // Interaction Overlays
  const [drawnCard, setDrawnCard] = useState(null); // { card, type: 'chance'|'community' }
  const [selectedProperty, setSelectedProperty] = useState(null); // For detail view / manage
  const [activeAuction, setActiveAuction] = useState(null); // { spaceId, currentBid, bidderIndex, highestBidderIndex, activeBidders }
  const [activeTrade, setActiveTrade] = useState(null); // { senderIndex, receiverIndex, senderProperties: [], receiverProperties: [], senderCash: 0, receiverCash: 0 }
  
  // R3F Animation States
  const [pawnMoving, setPawnMoving] = useState(false);
  const [focusedPawnIndex, setFocusedPawnIndex] = useState(null);

  // Multi-tab channel ref for WebRTC/BroadcastChannel fallback
  const channelRef = useRef(null);

  // Initialize board spaces when theme changes
  useEffect(() => {
    const originalBoard = boardTheme === 'INDIAN_BUSINESS' ? INDIAN_BUSINESS_BOARD : INTERNATIONAL_COUNTRIES_BOARD;
    // Map board structure into deep stateful copy
    const initialSpaces = originalBoard.map(space => ({
      ...space,
      ownerId: null,
      houses: 0,
      hotel: false,
      isMortgaged: false,
    }));
    setBoardSpaces(initialSpaces);
  }, [boardTheme]);

  // Log utility
  const addLog = (message) => {
    setLogs(prev => [message, ...prev].slice(0, 100));
  };

  // Check victory condition
  useEffect(() => {
    if (!gameStarted || players.length === 0) return;
    const activePlayers = players.filter(p => !p.isBankrupt);
    if (activePlayers.length === 1) {
      setWinner(activePlayers[0]);
      addLog(`🏆 Game Over! ${activePlayers[0].name} has won the game!`);
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  }, [players, gameStarted]);

  // Handle Supabase / BroadcastChannel real-time listeners for Online Mode
  useEffect(() => {
    if (gameMode !== 'online' || !roomCode) return;

    const handleRoomUpdate = (room) => {
      if (!room) return;
      if (room.board_theme) setBoardTheme(room.board_theme);
      if (room.status === 'playing') setGameStarted(true);
      if (room.players) setPlayers(room.players);
      
      if (room.game_state) {
        const gs = room.game_state;
        if (gs.turnIndex !== undefined) setTurnIndex(gs.turnIndex);
        if (gs.dice) setDice(gs.dice);
        if (gs.isDiceRolled !== undefined) setIsDiceRolled(gs.isDiceRolled);
        if (gs.logs) setLogs(gs.logs);
        if (gs.properties) {
          // Re-sync properties onto board spaces
          setBoardSpaces(prev => {
            const copy = prev.map(space => {
              const saved = gs.properties.find(p => p.id === space.id);
              if (saved) {
                return {
                  ...space,
                  ownerId: saved.ownerId,
                  houses: saved.houses,
                  hotel: saved.hotel,
                  isMortgaged: saved.isMortgaged
                };
              }
              return { ...space, ownerId: null, houses: 0, hotel: false, isMortgaged: false };
            });
            return copy;
          });
        }
      }
    };

    if (isSupabaseConfigured) {
      // Connect to Supabase Room Channel
      const roomChannel = supabase
        .channel(`room:${roomCode}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'game_rooms', filter: `room_code=eq.${roomCode}` },
          (payload) => {
            handleRoomUpdate(payload.new);
          }
        )
        .subscribe();

      // Listen for interactive events (e.g. dice roll anim, pawn moves)
      const broadcastChannel = supabase
        .channel(`broadcast:${roomCode}`)
        .on('broadcast', { event: 'dice_rolling' }, (payload) => {
          setDiceRolling(true);
          setDice(payload.payload.dice);
        })
        .on('broadcast', { event: 'dice_stopped' }, (payload) => {
          setDiceRolling(false);
          setDice(payload.payload.dice);
        })
        .on('broadcast', { event: 'pawn_moving' }, (payload) => {
          setPawnMoving(true);
          setFocusedPawnIndex(payload.payload.playerIndex);
        })
        .on('broadcast', { event: 'pawn_stopped' }, () => {
          setPawnMoving(false);
        })
        .subscribe();

      channelRef.current = {
        send: (event, payload) => {
          broadcastChannel.send({
            type: 'broadcast',
            event,
            payload
          });
        },
        unsubscribe: () => {
          roomChannel.unsubscribe();
          broadcastChannel.unsubscribe();
        }
      };
    } else {
      // BroadcastChannel Mock real-time syncing for multi-tab
      const channel = mockRealtime.getChannel(roomCode, (msg) => {
        if (msg.type === 'ROOM_UPDATED') {
          handleRoomUpdate(msg.room);
        } else if (msg.type === 'DICE_ROLLING') {
          setDiceRolling(true);
          setDice(msg.dice);
        } else if (msg.type === 'DICE_STOPPED') {
          setDiceRolling(false);
          setDice(msg.dice);
        } else if (msg.type === 'PAWN_MOVING') {
          setPawnMoving(true);
          setFocusedPawnIndex(msg.playerIndex);
        } else if (msg.type === 'PAWN_STOPPED') {
          setPawnMoving(false);
        }
      });

      channelRef.current = {
        send: (event, payload) => {
          channel.send({ type: event.toUpperCase(), ...payload });
        },
        unsubscribe: () => {
          channel.unsubscribe();
        }
      };
    }

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [gameMode, roomCode]);

  // Synchronize state back to database / BroadcastChannel
  const pushState = (updatedPlayers, updatedSpaces, currentTurnIdx, isDiceRolledVal, customLogs) => {
    if (gameMode !== 'online' || !roomCode) return;
    
    // Package properties list
    const propertiesData = updatedSpaces
      .filter(s => s.ownerId)
      .map(s => ({
        id: s.id,
        ownerId: s.ownerId,
        houses: s.houses,
        hotel: s.hotel,
        isMortgaged: s.isMortgaged
      }));

    const gameState = {
      turnIndex: currentTurnIdx !== undefined ? currentTurnIdx : turnIndex,
      dice,
      isDiceRolled: isDiceRolledVal !== undefined ? isDiceRolledVal : isDiceRolled,
      properties: propertiesData,
      logs: customLogs || logs,
      gameStarted: true
    };

    syncRoomState(roomCode, updatedPlayers, gameState, 'playing');
  };

  // Setup local game players
  const startLocalGame = (customPlayers, selectedTheme) => {
    setBoardTheme(selectedTheme);
    const startCash = selectedTheme === 'INDIAN_BUSINESS' ? 25000 : 1500;
    const initialPlayers = customPlayers.map((name, index) => ({
      id: `local_${index}`,
      name,
      token: index,
      balance: startCash,
      position: 0,
      isBankrupt: false,
      inJail: false,
      jailTurns: 0,
      isHost: index === 0,
      isBot: false
    }));
    
    setPlayers(initialPlayers);
    setGameMode('local');
    setTurnIndex(0);
    setLogs(['Game started! Roll dice to begin.']);
    setWinner(null);
    setGameStarted(true);
  };

  // Setup bot game players
  const startBotGame = (playerName, botCount, selectedTheme) => {
    setBoardTheme(selectedTheme);
    const startCash = selectedTheme === 'INDIAN_BUSINESS' ? 25000 : 1500;
    const botNames = ['Chanakya AI', 'Vyapaar Bot', 'Kautilya AI', 'Rupee Bot'];
    
    const initialPlayers = [
      {
        id: 'player_human',
        name: playerName,
        token: 0,
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
      initialPlayers.push({
        id: `bot_${i}`,
        name: botNames[i % botNames.length],
        token: i + 1,
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
    setTurnIndex(0);
    setLogs(['Game against AI started!']);
    setWinner(null);
    setGameStarted(true);
  };

  // Launch online game (Host only)
  const startOnlineGame = () => {
    if (gameMode !== 'online' || !roomCode) return;
    const updatedPlayers = players.map(p => ({ ...p, position: 0 }));
    pushState(updatedPlayers, boardSpaces, 0, false, ['Game has started! Good luck.']);
    setGameStarted(true);
  };

  // Roll Dice physics & movement animation trigger
  const rollDice = async () => {
    if (isDiceRolled || diceRolling || pawnMoving) return;

    setDiceRolling(true);
    // Simulate dice rolling physics
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const nextDice = [d1, d2];
    
    // Broadcast rolling animation to other players in room
    if (channelRef.current) {
      channelRef.current.send('dice_rolling', { dice: nextDice });
    }

    // Dice animation delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    setDice(nextDice);
    setDiceRolling(false);
    setIsDiceRolled(true);

    if (channelRef.current) {
      channelRef.current.send('dice_stopped', { dice: nextDice });
    }

    const steps = d1 + d2;
    const currentPlayer = players[turnIndex];

    addLog(`🎲 ${currentPlayer.name} rolled ${steps} (${d1} + ${d2})`);

    // Handle Doubles / Jail Logic
    let currentInJail = currentPlayer.inJail;
    let nextDoubleCount = doubleCount;

    if (d1 === d2) {
      if (currentInJail) {
        // Gets out of jail on double
        currentInJail = false;
        addLog(`🔓 ${currentPlayer.name} rolled doubles and got out of Jail!`);
        nextDoubleCount = 0;
      } else {
        nextDoubleCount += 1;
        if (nextDoubleCount === 3) {
          // Sent to jail for 3 doubles
          currentPlayer.inJail = true;
          currentPlayer.position = 9; // Jail index
          currentPlayer.jailTurns = 3;
          addLog(`🚔 ${currentPlayer.name} rolled 3 doubles and is sent to Jail!`);
          
          const updatedPlayers = players.map((p, idx) => idx === turnIndex ? { ...currentPlayer, inJail: true, position: 9, jailTurns: 3 } : p);
          setPlayers(updatedPlayers);
          setDoubleCount(0);
          pushState(updatedPlayers, boardSpaces, turnIndex, true);
          return;
        } else {
          addLog(`✨ Double! ${currentPlayer.name} gets another roll after this turn.`);
        }
      }
    } else {
      nextDoubleCount = 0;
    }
    setDoubleCount(nextDoubleCount);

    if (currentInJail) {
      // Pay fine or stay in jail
      currentPlayer.jailTurns -= 1;
      if (currentPlayer.jailTurns === 0) {
        // Forced to pay fine
        const fine = boardTheme === 'INDIAN_BUSINESS' ? 500 : 50;
        currentPlayer.balance -= fine;
        currentPlayer.inJail = false;
        addLog(`💸 ${currentPlayer.name} paid Jail Fine of ${boardTheme === 'INDIAN_BUSINESS' ? '₹' : '$'}${fine} and is released.`);
      } else {
        addLog(`🔒 ${currentPlayer.name} is in Jail. Remaining turns: ${currentPlayer.jailTurns}`);
        const updatedPlayers = players.map((p, idx) => idx === turnIndex ? { ...currentPlayer } : p);
        setPlayers(updatedPlayers);
        pushState(updatedPlayers, boardSpaces, turnIndex, true);
        return;
      }
    }

    // Move pawn step-by-step
    setPawnMoving(true);
    setFocusedPawnIndex(turnIndex);
    if (channelRef.current) {
      channelRef.current.send('pawn_moving', { playerIndex: turnIndex });
    }

    let currentPos = currentPlayer.position;
    for (let i = 0; i < steps; i++) {
      currentPos = (currentPos + 1) % 36;
      // Animate jump delay per space
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Update local visual pawn position immediately
      setPlayers(prev => prev.map((p, idx) => idx === turnIndex ? { ...p, position: currentPos } : p));
      
      // If passing start (GO)
      if (currentPos === 0 && i < steps - 1) {
        const bonus = boardTheme === 'INDIAN_BUSINESS' ? 1500 : 200;
        currentPlayer.balance += bonus;
        addLog(`💰 Passed START! ${currentPlayer.name} collects ${boardTheme === 'INDIAN_BUSINESS' ? '₹' : '$'}${bonus}`);
      }
    }

    setPawnMoving(false);
    if (channelRef.current) {
      channelRef.current.send('pawn_stopped', {});
    }

    // Apply land actions on final space
    currentPlayer.position = currentPos;
    handleLandingSpace(currentPlayer, currentPos);
  };

  // Land actions logic
  const handleLandingSpace = (player, spaceId) => {
    const space = boardSpaces[spaceId];
    const fineTextSymbol = boardTheme === 'INDIAN_BUSINESS' ? '₹' : '$';
    
    // Start space
    if (space.type === 'start') {
      const bonus = boardTheme === 'INDIAN_BUSINESS' ? 1500 : 200;
      player.balance += bonus;
      addLog(`💰 Landed on START! ${player.name} collects ${fineTextSymbol}${bonus}`);
    }

    // Tax spaces
    else if (space.type === 'tax') {
      player.balance -= space.penalty;
      addLog(`💸 Landed on ${space.name}! Paid Tax of ${fineTextSymbol}${space.penalty} to Bank.`);
    }

    // Club House
    else if (space.type === 'club') {
      if (space.penalty > 0) {
        // Pay ₹100 to all players
        const activeIdx = turnIndex;
        const otherActivePlayersCount = players.filter((p, idx) => idx !== activeIdx && !p.isBankrupt).length;
        const totalPaid = otherActivePlayersCount * 100;
        
        const currentPlayers = players.map((p, idx) => {
          if (idx === activeIdx) {
            return { ...player, balance: player.balance - totalPaid };
          }
          if (!p.isBankrupt) {
            return { ...p, balance: p.balance + 100 };
          }
          return p;
        });

        addLog(`🍻 Club House! ${player.name} bought drinks for everyone. Paid ${fineTextSymbol}100 to each player.`);
        setPlayers(currentPlayers);
        pushState(currentPlayers, boardSpaces, turnIndex, true);
        return;
      }
    }

    // Rest House
    else if (space.type === 'rest') {
      // Indian Business: Lose turn, International: Go to jail (if index 27)
      if (boardTheme === 'INDIAN_BUSINESS') {
        player.jailTurns = 1; // Lose next turn
        addLog(`🏨 Landed on Rest House! ${player.name} takes a nap and misses next turn.`);
      } else {
        player.inJail = true;
        player.position = 9; // Send to jail
        player.jailTurns = 3;
        addLog(`🚔 Go To Jail! ${player.name} is sent straight to Jail.`);
      }
    }

    // Rent collection if owned
    else if (space.ownerId && space.ownerId !== player.id) {
      const owner = players.find(p => p.id === space.ownerId);
      if (owner && !space.isMortgaged && !owner.isBankrupt) {
        const rent = calculateRent(space, owner.id, null, boardSpaces, boardTheme, dice[0] + dice[1]);
        player.balance -= rent;
        owner.balance += rent;
        addLog(`💸 Paid rent of ${fineTextSymbol}${rent} to ${owner.name} for landing on ${space.name}`);
      }
    }

    // Card Draw landing
    else if (space.type === 'chance' || space.type === 'community') {
      drawCard(space.type, player);
      return; // Handled inside card drawer
    }

    // Update players
    const nextPlayers = players.map((p, idx) => idx === turnIndex ? { ...player } : p);
    setPlayers(nextPlayers);
    pushState(nextPlayers, boardSpaces, turnIndex, true);
  };

  // Card drawing system
  const drawCard = (type, player) => {
    const list = type === 'chance' ? CHANCE_CARDS : COMMUNITY_CARDS;
    const card = list[Math.floor(Math.random() * list.length)];
    const fineTextSymbol = boardTheme === 'INDIAN_BUSINESS' ? '₹' : '$';

    setDrawnCard({ card, type });
    addLog(`🎴 Draw Card: "${card.text}"`);

    let updatedPlayers = [...players];

    switch (card.action) {
      case 'move_start':
        player.position = 0;
        player.balance += (boardTheme === 'INDIAN_BUSINESS' ? 1500 : 200);
        break;
      case 'pay_penalty':
        player.balance -= card.amount;
        break;
      case 'collect_bonus':
        player.balance += card.amount;
        break;
      case 'go_jail':
        player.inJail = true;
        player.position = 9;
        player.jailTurns = 3;
        break;
      case 'repair_fee':
        let housesCount = 0;
        let hotelsCount = 0;
        boardSpaces.forEach(s => {
          if (s.ownerId === player.id) {
            housesCount += s.houses || 0;
            if (s.hotel) hotelsCount += 1;
          }
        });
        const totalRepair = (housesCount * card.houseFee) + (hotelsCount * card.hotelFee);
        player.balance -= totalRepair;
        addLog(`🔧 Property repair costs ${fineTextSymbol}${totalRepair} for ${housesCount} houses and ${hotelsCount} hotels.`);
        break;
      case 'birthday_gift':
        let birthdayGiftTotal = 0;
        updatedPlayers = players.map((p, idx) => {
          if (idx !== turnIndex && !p.isBankrupt) {
            birthdayGiftTotal += card.amount;
            return { ...p, balance: p.balance - card.amount };
          }
          return p;
        });
        player.balance += birthdayGiftTotal;
        break;
      case 'move_nearest_transport':
        // Find nearest transport indices: 3, 12, 20, 31
        const transportLocations = [3, 12, 20, 31];
        const currentP = player.position;
        let nearestT = transportLocations.find(loc => loc > currentP);
        if (nearestT === undefined) nearestT = transportLocations[0];
        
        player.position = nearestT;
        // Rent rules
        const tSpace = boardSpaces[nearestT];
        if (tSpace.ownerId && tSpace.ownerId !== player.id) {
          const owner = players.find(p => p.id === tSpace.ownerId);
          if (owner && !tSpace.isMortgaged) {
            const doubleRent = calculateRent(tSpace, owner.id, null, boardSpaces, boardTheme) * 2;
            player.balance -= doubleRent;
            owner.balance += doubleRent;
            addLog(`💸 Paid double rent of ${fineTextSymbol}${doubleRent} to ${owner.name}`);
          }
        }
        break;
      case 'get_out_jail_free':
        player.hasJailCard = true;
        break;
      default:
        break;
    }

    updatedPlayers = updatedPlayers.map((p, idx) => idx === turnIndex ? { ...player } : p);
    setPlayers(updatedPlayers);
    pushState(updatedPlayers, boardSpaces, turnIndex, true);
  };

  // Buy current landing property
  const buyProperty = () => {
    const player = players[turnIndex];
    const space = boardSpaces[player.position];
    if (!space || space.ownerId || player.balance < space.cost) return;

    player.balance -= space.cost;
    const nextSpaces = boardSpaces.map(s => s.id === space.id ? { ...s, ownerId: player.id } : s);
    const nextPlayers = players.map((p, idx) => idx === turnIndex ? { ...player } : p);

    setBoardSpaces(nextSpaces);
    setPlayers(nextPlayers);
    addLog(`🏠 ${player.name} bought ${space.name} for ${boardTheme === 'INDIAN_BUSINESS' ? '₹' : '$'}${space.cost}`);
    pushState(nextPlayers, nextSpaces, turnIndex, true);
  };

  // Build house on property
  const buildHouse = (spaceId) => {
    const space = boardSpaces[spaceId];
    if (!space || !space.ownerId) return;

    const owner = players.find(p => p.id === space.ownerId);
    if (owner.balance < space.houseCost || space.houses >= 5 || space.isMortgaged) return;

    owner.balance -= space.houseCost;
    const nextSpaces = boardSpaces.map(s => {
      if (s.id === spaceId) {
        const nextHouses = s.houses + 1;
        return {
          ...s,
          houses: nextHouses,
          hotel: nextHouses === 5
        };
      }
      return s;
    });

    const nextPlayers = players.map(p => p.id === owner.id ? { ...owner } : p);

    setBoardSpaces(nextSpaces);
    setPlayers(nextPlayers);
    addLog(`🧱 ${owner.name} built a ${space.houses === 4 ? 'Hotel' : 'House'} on ${space.name}`);
    
    // Refresh detail view
    setSelectedProperty(nextSpaces.find(s => s.id === spaceId));
    pushState(nextPlayers, nextSpaces, turnIndex, isDiceRolled);
  };

  // Mortgage property
  const mortgageProperty = (spaceId) => {
    const space = boardSpaces[spaceId];
    if (!space || !space.ownerId || space.isMortgaged || space.houses > 0) return;

    const owner = players.find(p => p.id === space.ownerId);
    owner.balance += space.mortgageValue;

    const nextSpaces = boardSpaces.map(s => s.id === spaceId ? { ...s, isMortgaged: true } : s);
    const nextPlayers = players.map(p => p.id === owner.id ? { ...owner } : p);

    setBoardSpaces(nextSpaces);
    setPlayers(nextPlayers);
    addLog(`🏦 ${owner.name} mortgaged ${space.name} for ${boardTheme === 'INDIAN_BUSINESS' ? '₹' : '$'}${space.mortgageValue}`);
    
    setSelectedProperty(nextSpaces.find(s => s.id === spaceId));
    pushState(nextPlayers, nextSpaces, turnIndex, isDiceRolled);
  };

  // Unmortgage property
  const unmortgageProperty = (spaceId) => {
    const space = boardSpaces[spaceId];
    if (!space || !space.ownerId || !space.isMortgaged) return;

    const owner = players.find(p => p.id === space.ownerId);
    // Unmortgage costs mortgage value + 10% interest
    const fee = Math.round(space.mortgageValue * 1.1);
    if (owner.balance < fee) return;

    owner.balance -= fee;

    const nextSpaces = boardSpaces.map(s => s.id === spaceId ? { ...s, isMortgaged: false } : s);
    const nextPlayers = players.map(p => p.id === owner.id ? { ...owner } : p);

    setBoardSpaces(nextSpaces);
    setPlayers(nextPlayers);
    addLog(`🏦 ${owner.name} unmortgaged ${space.name} for ${boardTheme === 'INDIAN_BUSINESS' ? '₹' : '$'}${fee}`);
    
    setSelectedProperty(nextSpaces.find(s => s.id === spaceId));
    pushState(nextPlayers, nextSpaces, turnIndex, isDiceRolled);
  };

  // Declare Bankruptcy
  const declareBankruptcy = () => {
    const player = players[turnIndex];
    player.isBankrupt = true;

    // Reset owned properties back to Bank
    const nextSpaces = boardSpaces.map(s => {
      if (s.ownerId === player.id) {
        return {
          ...s,
          ownerId: null,
          houses: 0,
          hotel: false,
          isMortgaged: false
        };
      }
      return s;
    });

    const nextPlayers = players.map((p, idx) => idx === turnIndex ? { ...player } : p);

    setBoardSpaces(nextSpaces);
    setPlayers(nextPlayers);
    addLog(`💀 ${player.name} went Bankrupt! All properties returned to Bank.`);
    
    // Force end turn
    endTurn(nextPlayers, nextSpaces);
  };

  // Pay Jail Fine Action
  const payJailFine = () => {
    const currentPlayer = players[turnIndex];
    if (!currentPlayer.inJail) return;

    const fine = boardTheme === 'INDIAN_BUSINESS' ? 500 : 50;
    currentPlayer.balance -= fine;
    currentPlayer.inJail = false;
    currentPlayer.jailTurns = 0;
    
    addLog(`💸 ${currentPlayer.name} paid Jail Fine of ${boardTheme === 'INDIAN_BUSINESS' ? '₹' : '$'}${fine} and is released.`);
    
    const nextPlayers = players.map((p, idx) => idx === turnIndex ? { ...currentPlayer } : p);
    setPlayers(nextPlayers);
    pushState(nextPlayers, boardSpaces, turnIndex, false);
  };

  // Use Get Out of Jail Card Action
  const useJailCard = () => {
    const currentPlayer = players[turnIndex];
    if (!currentPlayer.inJail || !currentPlayer.hasJailCard) return;

    currentPlayer.inJail = false;
    currentPlayer.jailTurns = 0;
    currentPlayer.hasJailCard = false;
    
    addLog(`🔓 ${currentPlayer.name} used a Get Out of Jail Free Card and is released.`);
    
    const nextPlayers = players.map((p, idx) => idx === turnIndex ? { ...currentPlayer } : p);
    setPlayers(nextPlayers);
    pushState(nextPlayers, boardSpaces, turnIndex, false);
  };

  // Wake Up & End Turn (Rest House) Action
  const wakeUpAndEndTurn = () => {
    const currentPlayer = players[turnIndex];
    currentPlayer.jailTurns = 0;
    
    addLog(`🌅 ${currentPlayer.name} woke up from the Rest House!`);
    
    const nextPlayers = players.map((p, idx) => idx === turnIndex ? { ...currentPlayer } : p);
    setPlayers(nextPlayers);
    endTurn(nextPlayers, boardSpaces);
  };

  // End active player turn
  const endTurn = (customPlayers, customSpaces) => {
    const activePlayers = customPlayers || players;
    const activeSpaces = customSpaces || boardSpaces;
    
    let nextIndex = turnIndex;
    
    // Find next non-bankrupt player
    do {
      nextIndex = (nextIndex + 1) % activePlayers.length;
    } while (activePlayers[nextIndex].isBankrupt && nextIndex !== turnIndex);

    setTurnIndex(nextIndex);
    setIsDiceRolled(false);
    setDrawnCard(null);
    setSelectedProperty(null);

    // Sync state
    pushState(activePlayers, activeSpaces, nextIndex, false);
  };

  // Execute bot turn actions
  useEffect(() => {
    if (!gameStarted || winner) return;
    
    const currentPlayer = players[turnIndex];
    if (!currentPlayer || !currentPlayer.isBot || currentPlayer.isBankrupt) return;

    const runBotTurn = async () => {
      // 0. Check if bot is resting at Rest House
      if (currentPlayer.jailTurns > 0 && !currentPlayer.inJail) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        currentPlayer.jailTurns = 0;
        addLog(`🌅 ${currentPlayer.name} (Bot) woke up from the Rest House!`);
        const nextPlayers = players.map((p, idx) => idx === turnIndex ? { ...currentPlayer } : p);
        setPlayers(nextPlayers);
        endTurn(nextPlayers, boardSpaces);
        return;
      }

      // 0.5. Check if bot is in jail and can escape immediately
      if (currentPlayer.inJail) {
        if (currentPlayer.hasJailCard) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          currentPlayer.inJail = false;
          currentPlayer.jailTurns = 0;
          currentPlayer.hasJailCard = false;
          addLog(`🔓 ${currentPlayer.name} (Bot) used a Get Out of Jail Free Card and is released.`);
          const nextPlayers = players.map((p, idx) => idx === turnIndex ? { ...currentPlayer } : p);
          setPlayers(nextPlayers);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else if (currentPlayer.balance > (boardTheme === 'INDIAN_BUSINESS' ? 10000 : 600)) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          const fine = boardTheme === 'INDIAN_BUSINESS' ? 500 : 50;
          currentPlayer.balance -= fine;
          currentPlayer.inJail = false;
          currentPlayer.jailTurns = 0;
          addLog(`💸 ${currentPlayer.name} (Bot) paid Jail Fine of ${boardTheme === 'INDIAN_BUSINESS' ? '₹' : '$'}${fine} and is released.`);
          const nextPlayers = players.map((p, idx) => idx === turnIndex ? { ...currentPlayer } : p);
          setPlayers(nextPlayers);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // 1. Wait, then roll dice (either standard or for doubles)
      await new Promise(resolve => setTimeout(resolve, 1500));
      if (!isDiceRolled && !diceRolling && !pawnMoving) {
        await rollDice();
      }

      // 2. Wait for pawn movement to fully settle
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 3. Make choices (Buy, Build, Mortgage, Bankruptcy)
      const mockState = {
        currentSpace: players[turnIndex].position,
        balance: players[turnIndex].balance,
        allSpaces: boardSpaces,
        boardTheme
      };

      const botActions = makeBotDecision(currentPlayer.id, mockState);

      // Perform actions one by one
      for (const act of botActions) {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        if (act.type === 'BUY_PROPERTY') {
          // Find player and buy
          buyProperty();
        } else if (act.type === 'BUILD_HOUSE') {
          buildHouse(act.spaceId);
        } else if (act.type === 'MORTGAGE') {
          mortgageProperty(act.spaceId);
        } else if (act.type === 'BANKRUPTCY') {
          declareBankruptcy();
          return;
        }
      }

      // 4. Wait, then end turn
      await new Promise(resolve => setTimeout(resolve, 1000));
      endTurn();
    };

    runBotTurn();
  }, [turnIndex, isDiceRolled, gameStarted, winner]);

  return (
    <GameContext.Provider value={{
      gameStarted,
      gameMode,
      boardTheme,
      roomCode,
      myPlayerId,
      players,
      turnIndex,
      boardSpaces,
      dice,
      isDiceRolled,
      diceRolling,
      logs,
      winner,
      drawnCard,
      selectedProperty,
      activeAuction,
      activeTrade,
      pawnMoving,
      focusedPawnIndex,
      setGameMode,
      setBoardTheme,
      setRoomCode,
      setMyPlayerId,
      setPlayers,
      setGameStarted,
      setSelectedProperty,
      setDrawnCard,
      startLocalGame,
      startBotGame,
      startOnlineGame,
      rollDice,
      buyProperty,
      buildHouse,
      mortgageProperty,
      unmortgageProperty,
      declareBankruptcy,
      endTurn,
      addLog,
      payJailFine,
      useJailCard,
      wakeUpAndEndTurn,
    }}>
      {children}
    </GameContext.Provider>
  );
};
