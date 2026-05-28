// Board configurations, card data, and logic functions for Monopoly / Business game.

export const BOARD_THEMES = {
  INDIAN_BUSINESS: 'INDIAN_BUSINESS',
  INTERNATIONAL_COUNTRIES: 'INTERNATIONAL_COUNTRIES',
};

// 36 spaces: 4 corners (0, 9, 18, 27) and 8 side spaces between each corner
export const INDIAN_BUSINESS_BOARD = [
  { id: 0, name: 'START', type: 'start', cost: 0, rent: [0], mortgageValue: 0 },
  { id: 1, name: 'Mumbai', type: 'property', group: 'pink', cost: 8500, rent: [800, 1500, 3500, 7500, 11000, 15000], houseCost: 4000, mortgageValue: 4250 },
  { id: 2, name: 'Water Works', type: 'utility', cost: 3200, mortgageValue: 1600 },
  { id: 3, name: 'Railway', type: 'transport', cost: 9500, mortgageValue: 4750 },
  { id: 4, name: 'Ahmedabad', type: 'property', group: 'pink', cost: 4500, rent: [400, 1000, 2500, 5000, 7500, 10000], houseCost: 2000, mortgageValue: 2250 },
  { id: 5, name: 'Income Tax', type: 'tax', cost: 0, penalty: 1500 },
  { id: 6, name: 'Indore', type: 'property', group: 'pink', cost: 3500, rent: [300, 800, 2000, 4000, 6000, 8000], houseCost: 2000, mortgageValue: 1750 },
  { id: 7, name: 'Chance', type: 'chance' },
  { id: 8, name: 'Jaipur', type: 'property', group: 'green', cost: 3000, rent: [250, 700, 1800, 3500, 5000, 7000], houseCost: 1500, mortgageValue: 1500 },
  
  { id: 9, name: 'JAIL', type: 'jail', cost: 0, rent: [0], mortgageValue: 0 },
  { id: 10, name: 'Delhi', type: 'property', group: 'green', cost: 6000, rent: [600, 1200, 3000, 6000, 9000, 12000], houseCost: 3000, mortgageValue: 3000 },
  { id: 11, name: 'Electric Co.', type: 'utility', cost: 2500, mortgageValue: 1250 },
  { id: 12, name: 'Motor Boat', type: 'transport', cost: 5500, mortgageValue: 2750 },
  { id: 13, name: 'Chandigarh', type: 'property', group: 'green', cost: 2500, rent: [200, 600, 1500, 3000, 4500, 6000], houseCost: 1500, mortgageValue: 1250 },
  { id: 14, name: 'Wealth Tax', type: 'tax', cost: 0, penalty: 2000 },
  { id: 15, name: 'Shimla', type: 'property', group: 'yellow', cost: 2200, rent: [180, 500, 1200, 2400, 3600, 4800], houseCost: 1500, mortgageValue: 1100 },
  { id: 16, name: 'Community Chest', type: 'community' },
  { id: 17, name: 'Amritsar', type: 'property', group: 'yellow', cost: 3200, rent: [250, 750, 1800, 3500, 5000, 7000], houseCost: 1500, mortgageValue: 1600 },
  
  { id: 18, name: 'CLUB HOUSE', type: 'club', cost: 0, penalty: 1000 },
  { id: 19, name: 'Srinagar', type: 'property', group: 'yellow', cost: 4000, rent: [350, 900, 2200, 4500, 6500, 9000], houseCost: 2000, mortgageValue: 2000 },
  { id: 20, name: 'Airways', type: 'transport', cost: 10500, mortgageValue: 5250 },
  { id: 21, name: 'Patna', type: 'property', group: 'blue', cost: 2000, rent: [150, 400, 1000, 2000, 3000, 4000], houseCost: 1000, mortgageValue: 1000 },
  { id: 22, name: 'Darjeeling', type: 'property', group: 'blue', cost: 2500, rent: [200, 500, 1200, 2400, 3600, 4800], houseCost: 1500, mortgageValue: 1250 },
  { id: 23, name: 'Chance', type: 'chance' },
  { id: 24, name: 'Kolkata', type: 'property', group: 'blue', cost: 8500, rent: [800, 1500, 3500, 7500, 11000, 15000], houseCost: 4000, mortgageValue: 4250 },
  { id: 25, name: 'Chennai', type: 'property', group: 'red', cost: 7000, rent: [700, 1400, 3200, 6500, 9500, 13000], houseCost: 3000, mortgageValue: 3500 },
  { id: 26, name: 'Bengaluru', type: 'property', group: 'red', cost: 6000, rent: [600, 1200, 3000, 6000, 9000, 12000], houseCost: 3000, mortgageValue: 3000 },
  
  { id: 27, name: 'REST HOUSE', type: 'rest', cost: 0, rent: [0], mortgageValue: 0 },
  { id: 28, name: 'Hyderabad', type: 'property', group: 'red', cost: 3500, rent: [300, 800, 2000, 4000, 6000, 8000], houseCost: 2000, mortgageValue: 1750 },
  { id: 29, name: 'Pune', type: 'property', group: 'purple', cost: 3000, rent: [250, 700, 1800, 3500, 5000, 7000], houseCost: 1500, mortgageValue: 1500 },
  { id: 30, name: 'Cochin', type: 'property', group: 'purple', cost: 3000, rent: [250, 700, 1800, 3500, 5000, 7000], houseCost: 1500, mortgageValue: 1500 },
  { id: 31, name: 'Tramway', type: 'transport', cost: 5500, mortgageValue: 2750 },
  { id: 32, name: 'Bhopal', type: 'property', group: 'purple', cost: 2500, rent: [200, 600, 1500, 3000, 4500, 6000], houseCost: 1500, mortgageValue: 1250 },
  { id: 33, name: 'Lucknow', type: 'property', group: 'orange', cost: 2500, rent: [200, 600, 1500, 3000, 4500, 6000], houseCost: 1500, mortgageValue: 1250 },
  { id: 34, name: 'Community Chest', type: 'community' },
  { id: 35, name: 'Agra', type: 'property', group: 'orange', cost: 2500, rent: [200, 600, 1500, 3000, 4500, 6000], houseCost: 1500, mortgageValue: 1250 }
];

export const INTERNATIONAL_COUNTRIES_BOARD = [
  { id: 0, name: 'START', type: 'start', cost: 0, rent: [0], mortgageValue: 0 },
  { id: 1, name: 'USA', type: 'property', group: 'pink', cost: 400, rent: [50, 200, 600, 1400, 1700, 2000], houseCost: 200, mortgageValue: 200 },
  { id: 2, name: 'Water Works', type: 'utility', cost: 150, mortgageValue: 75 },
  { id: 3, name: 'Trans-Siberian Railway', type: 'transport', cost: 200, mortgageValue: 100 },
  { id: 4, name: 'Canada', type: 'property', group: 'pink', cost: 350, rent: [35, 175, 500, 1100, 1300, 1500], houseCost: 200, mortgageValue: 175 },
  { id: 5, name: 'Income Tax', type: 'tax', cost: 0, penalty: 150 },
  { id: 6, name: 'Mexico', type: 'property', group: 'pink', cost: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200, mortgageValue: 150 },
  { id: 7, name: 'Chance', type: 'chance' },
  { id: 8, name: 'Brazil', type: 'property', group: 'green', cost: 320, rent: [28, 150, 450, 1000, 1200, 1400], houseCost: 200, mortgageValue: 160 },
  
  { id: 9, name: 'JAIL', type: 'jail', cost: 0, rent: [0], mortgageValue: 0 },
  { id: 10, name: 'Argentina', type: 'property', group: 'green', cost: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200, mortgageValue: 150 },
  { id: 11, name: 'Power Grid', type: 'utility', cost: 150, mortgageValue: 75 },
  { id: 12, name: 'Panama Canal', type: 'transport', cost: 200, mortgageValue: 100 },
  { id: 13, name: 'Chile', type: 'property', group: 'green', cost: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150, mortgageValue: 130 },
  { id: 14, name: 'Luxury Tax', type: 'tax', cost: 0, penalty: 100 },
  { id: 15, name: 'United Kingdom', type: 'property', group: 'yellow', cost: 280, rent: [24, 120, 360, 850, 1025, 1200], houseCost: 150, mortgageValue: 140 },
  { id: 16, name: 'Community Chest', type: 'community' },
  { id: 17, name: 'France', type: 'property', group: 'yellow', cost: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150, mortgageValue: 130 },
  
  { id: 18, name: 'FREE PARKING', type: 'club', cost: 0, penalty: 0 }, // Set penalty to 0 so free parking is neutral
  { id: 19, name: 'Germany', type: 'property', group: 'yellow', cost: 240, rent: [20, 100, 300, 750, 925, 1100], houseCost: 150, mortgageValue: 120 },
  { id: 20, name: 'Eurotunnel', type: 'transport', cost: 200, mortgageValue: 100 },
  { id: 21, name: 'Italy', type: 'property', group: 'blue', cost: 240, rent: [20, 100, 300, 750, 925, 1100], houseCost: 150, mortgageValue: 120 },
  { id: 22, name: 'Spain', type: 'property', group: 'blue', cost: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150, mortgageValue: 110 },
  { id: 23, name: 'Chance', type: 'chance' },
  { id: 24, name: 'Japan', type: 'property', group: 'blue', cost: 320, rent: [28, 150, 450, 1000, 1200, 1400], houseCost: 200, mortgageValue: 160 },
  { id: 25, name: 'China', type: 'property', group: 'red', cost: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200, mortgageValue: 150 },
  { id: 26, name: 'India', type: 'property', group: 'red', cost: 280, rent: [24, 120, 360, 850, 1025, 1200], houseCost: 150, mortgageValue: 140 },
  
  { id: 27, name: 'GO TO JAIL', type: 'rest', cost: 0, rent: [0], mortgageValue: 0 }, // In this version, index 27 acts as "Go to jail"
  { id: 28, name: 'Australia', type: 'property', group: 'red', cost: 350, rent: [35, 175, 500, 1100, 1300, 1500], houseCost: 200, mortgageValue: 175 },
  { id: 29, name: 'New Zealand', type: 'property', group: 'purple', cost: 200, rent: [16, 80, 220, 600, 725, 900], houseCost: 100, mortgageValue: 100 },
  { id: 30, name: 'South Africa', type: 'property', group: 'purple', cost: 180, rent: [14, 70, 200, 550, 700, 850], houseCost: 100, mortgageValue: 90 },
  { id: 31, name: 'Suez Canal', type: 'transport', cost: 200, mortgageValue: 100 },
  { id: 32, name: 'Egypt', type: 'property', group: 'purple', cost: 160, rent: [12, 60, 180, 500, 625, 750], houseCost: 100, mortgageValue: 80 },
  { id: 33, name: 'Greece', type: 'property', group: 'orange', cost: 140, rent: [10, 50, 150, 450, 575, 700], houseCost: 100, mortgageValue: 70 },
  { id: 34, name: 'Community Chest', type: 'community' },
  { id: 35, name: 'Turkey', type: 'property', group: 'orange', cost: 120, rent: [8, 40, 100, 300, 450, 600], houseCost: 100, mortgageValue: 60 }
];

export const CHANCE_CARDS = [
  { id: 1, text: 'Advance to START. Collect salary!', action: 'move_start' },
  { id: 2, text: 'Speeding Fine! Pay penalty.', action: 'pay_penalty', amount: 500 },
  { id: 3, text: 'Go directly to JAIL. Do not pass START, do not collect salary.', action: 'go_jail' },
  { id: 4, text: 'Stock Market Jackpot! Collect winnings.', action: 'collect_bonus', amount: 3000 },
  { id: 5, text: 'Your properties need repair. Pay 500 per house and 1500 per hotel.', action: 'repair_fee', houseFee: 500, hotelFee: 1500 },
  { id: 6, text: 'Collect interest on bank savings! Get 1500.', action: 'collect_bonus', amount: 1500 },
  { id: 7, text: 'Tax Refund! Collect 1000.', action: 'collect_bonus', amount: 1000 },
  { id: 8, text: 'Advanced travel: Fly to nearest Transport space. If owned, pay double rent.', action: 'move_nearest_transport' },
  { id: 9, text: 'It is your Birthday! Collect 500 from every player.', action: 'birthday_gift', amount: 500 },
  { id: 10, text: 'Pay hospital bill of 1000.', action: 'pay_penalty', amount: 1000 }
];

export const COMMUNITY_CARDS = [
  { id: 1, text: 'Get Out of Jail Free! Keep this card.', action: 'get_out_jail_free' },
  { id: 2, text: 'Life insurance matures. Collect 2000.', action: 'collect_bonus', amount: 2000 },
  { id: 3, text: 'Income Tax refund. Collect 500.', action: 'collect_bonus', amount: 500 },
  { id: 4, text: 'Doctor fee. Pay 1000.', action: 'pay_penalty', amount: 1000 },
  { id: 5, text: 'Grand Opera Night. Collect 500 from every player for opening seats.', action: 'birthday_gift', amount: 500 },
  { id: 6, text: 'School fees. Pay 1500.', action: 'pay_penalty', amount: 1500 },
  { id: 7, text: 'Bank error in your favor. Collect 2000.', action: 'collect_bonus', amount: 2000 },
  { id: 8, text: 'Inherited wealth! Collect 5000.', action: 'collect_bonus', amount: 5000 },
  { id: 9, text: 'Pay insurance premium of 500.', action: 'pay_penalty', amount: 500 },
  { id: 10, text: 'Receive consultancy fee of 2500.', action: 'collect_bonus', amount: 2500 }
];

// Helper calculations
export function calculateRent(space, ownerId, properties, allSpaces, boardTheme) {
  if (space.type === 'property') {
    // If mortgaged, rent is 0
    if (space.isMortgaged) return 0;
    
    // Check houses count
    const houses = space.houses || 0;
    const hotel = space.hotel || false;
    
    if (hotel) return space.rent[5];
    if (houses > 0) return space.rent[houses];
    
    // Check if the owner owns all properties in this color group
    const colorGroup = space.group;
    const groupProperties = allSpaces.filter(s => s.type === 'property' && s.group === colorGroup);
    const ownerGroupCount = groupProperties.filter(s => s.ownerId === ownerId).length;
    
    if (ownerGroupCount === groupProperties.length) {
      // Rent is doubled if all group properties are owned and undeveloped
      return space.rent[0] * 2;
    }
    return space.rent[0];
  }
  
  if (space.type === 'transport') {
    if (space.isMortgaged) return 0;
    // Calculate how many transports the owner owns
    const allTransports = allSpaces.filter(s => s.type === 'transport');
    const ownedCount = allTransports.filter(s => s.ownerId === ownerId).length;
    
    // Rent doubles with each additional transport owned
    // 1 transport: base rent (e.g. 500 or 50), 2 transports: x2, 3 transports: x4, 4 transports: x8
    const baseRent = boardTheme === BOARD_THEMES.INDIAN_BUSINESS ? 1000 : 50;
    return baseRent * Math.pow(2, ownedCount - 1);
  }
  
  if (space.type === 'utility') {
    if (space.isMortgaged) return 0;
    const allUtilities = allSpaces.filter(s => s.type === 'utility');
    const ownedCount = allUtilities.filter(s => s.ownerId === ownerId).length;
    
    // Rent is multiplier times dice roll
    // 1 utility: 4x dice roll, 2 utilities: 10x dice roll
    // Let's assume a default dice roll of 7 if not provided
    const diceRoll = arguments[5] || 7;
    const multiplier = ownedCount === 2 ? 10 : 4;
    const scalingFactor = boardTheme === BOARD_THEMES.INDIAN_BUSINESS ? 100 : 10;
    return diceRoll * multiplier * scalingFactor;
  }
  
  return 0;
}

// Simple AI Bot Decision Maker
export function makeBotDecision(botId, gameState) {
  const { currentSpace, balance, properties, allSpaces, boardTheme } = gameState;
  const space = allSpaces[currentSpace];
  
  const actions = [];
  
  // 1. Can we buy the property?
  if (space && (space.type === 'property' || space.type === 'transport' || space.type === 'utility')) {
    if (!space.ownerId && balance >= space.cost) {
      // Rule of thumb for AI: Buy if balance after purchase is at least 15% of initial balance
      const initialBalance = boardTheme === BOARD_THEMES.INDIAN_BUSINESS ? 25000 : 1500;
      if (balance - space.cost >= initialBalance * 0.15) {
        actions.push({ type: 'BUY_PROPERTY', spaceId: space.id });
      }
    }
  }
  
  // 2. Can we build houses?
  // Let's find properties the bot owns that form complete groups and see if we can afford development
  const ownedProps = allSpaces.filter(s => s.ownerId === botId && s.type === 'property');
  const groupsOwned = {};
  
  ownedProps.forEach(p => {
    const groupName = p.group;
    const groupItems = allSpaces.filter(s => s.type === 'property' && s.group === groupName);
    const ownedInGroup = groupItems.filter(s => s.ownerId === botId);
    
    if (ownedInGroup.length === groupItems.length) {
      groupsOwned[groupName] = groupItems;
    }
  });
  
  // Try to build on the cheapest property in owned groups first
  Object.keys(groupsOwned).forEach(groupName => {
    const props = groupsOwned[groupName];
    // Find property with least houses
    props.sort((a, b) => (a.houses || 0) - (b.houses || 0));
    const targetProp = props[0];
    const housesCount = targetProp.houses || 0;
    const isHotel = targetProp.hotel || false;
    
    if (!isHotel && balance >= targetProp.houseCost + 1000) { // Keep safety buffer
      actions.push({ type: 'BUILD_HOUSE', spaceId: targetProp.id });
    }
  });

  // 3. Do we need to mortgage properties because we are in debt?
  if (balance < 0) {
    // Find unmortgaged properties to mortgage
    const mortgageCandidates = allSpaces.filter(s => s.ownerId === botId && !s.isMortgaged && (s.type === 'property' || s.type === 'transport' || s.type === 'utility'));
    // Sort by mortgage value descending to resolve debt quickly
    mortgageCandidates.sort((a, b) => b.mortgageValue - a.mortgageValue);
    
    let currentDebt = -balance;
    for (const cand of mortgageCandidates) {
      if (currentDebt > 0) {
        actions.push({ type: 'MORTGAGE', spaceId: cand.id });
        currentDebt -= cand.mortgageValue;
      } else {
        break;
      }
    }
    
    // If still in debt, declare bankruptcy
    if (currentDebt > 0) {
      actions.push({ type: 'BANKRUPTCY' });
    }
  }
  
  return actions;
}
