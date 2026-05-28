import React, { useMemo, useRef } from 'react';
import { useGame } from '../context/GameContext';
import * as THREE from 'three';

// Map space index to 3D board coordinates (perfect fit, zero overlap)
export function getSpaceCoordinates(index) {
  // Corners (corners are 1.6 x 1.6 size, centered at 4.2 units)
  if (index === 0) return [4.2, 0.05, 4.2];   // START
  if (index === 9) return [-4.2, 0.05, 4.2];  // JAIL
  if (index === 18) return [-4.2, 0.05, -4.2]; // CLUB HOUSE / FREE PARKING
  if (index === 27) return [4.2, 0.05, -4.2];  // REST HOUSE / GO TO JAIL

  // Sides (8 spaces per side of width 0.85, centered mathematically)
  // Distance between inner edges of corners is 8.4 - 1.6 = 6.8.
  // 8 side tiles of width 0.85 fit EXACTLY in 6.8 (8 * 0.85 = 6.8).
  if (index > 0 && index < 9) {
    // Bottom side (from right to left)
    return [3.4 - (index - 0.5) * 0.85, 0.05, 4.2];
  }
  if (index > 9 && index < 18) {
    // Left side (from bottom to top)
    return [-4.2, 0.05, 3.4 - (index - 9 - 0.5) * 0.85];
  }
  if (index > 18 && index < 27) {
    // Top side (from left to right)
    return [-3.4 + (index - 18 - 0.5) * 0.85, 0.05, -4.2];
  }
  if (index > 27 && index < 36) {
    // Right side (from top to bottom)
    return [4.2, 0.05, -3.4 + (index - 27 - 0.5) * 0.85];
  }

  return [0, 0, 0];
}

// Generate dynamic canvas textures for board spaces with aspect ratio matching physical dimensions (high performance)
function useTileTexture(space, index, isIndian) {
  const isCorner = index === 0 || index === 9 || index === 18 || index === 27;
  const w = isCorner ? 1024 : 512;
  const h = 1024;

  const canvasRef = useRef(null);
  const textureRef = useRef(null);

  // Initialize canvas and texture ONLY ONCE to avoid huge memory/GPU upload overhead
  if (!canvasRef.current) {
    canvasRef.current = document.createElement('canvas');
    canvasRef.current.width = w;
    canvasRef.current.height = h;
    textureRef.current = new THREE.CanvasTexture(canvasRef.current);
    textureRef.current.colorSpace = THREE.SRGBColorSpace;
  }

  // Counter-rotation angle to keep text upright in world coordinates (facing bottom/camera)
  const textAngle = useMemo(() => {
    if (index >= 0 && index <= 9) return 0; // Bottom
    if (index > 9 && index <= 18) return -Math.PI / 2; // Left
    if (index > 18 && index <= 27) return Math.PI; // Top
    return Math.PI / 2; // Right
  }, [index]);

  // Redraw ONLY when specific visual parameters change (no re-creations)
  useMemo(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const texture = textureRef.current;

    // Fill background - Cream/White for a clean look
    ctx.fillStyle = '#faf9f6';
    ctx.fillRect(0, 0, w, h);

    // Brutalist black border
    ctx.strokeStyle = '#1a1c23';
    ctx.lineWidth = isCorner ? 24 : 16;
    ctx.strokeRect(0, 0, w, h);

    // Helper function to draw text/emojis with counter-rotation to stay horizontal and upright on screen
    const drawText = (text, x, y, font, fillStyle, align = 'center') => {
      ctx.save();
      ctx.fillStyle = fillStyle;
      ctx.font = font;
      ctx.textAlign = align;
      if (textAngle === 0) {
        ctx.fillText(text, x, y);
      } else {
        ctx.translate(x, y);
        ctx.rotate(textAngle);
        ctx.fillText(text, 0, 0);
      }
      ctx.restore();
    };

    if (space.type === 'property' && space.group) {
      // Saturated neo-brutalist pastel color mapping
      const colors = {
        pink: '#ff4b91',
        green: '#00e676',
        yellow: '#ffd600',
        blue: '#2979ff',
        red: '#ff1744',
        purple: '#aa00ff',
        orange: '#ff6d00'
      };
      ctx.fillStyle = colors[space.group] || '#718096';
      // Draw banner at top (inner side)
      ctx.fillRect(0, 0, w, 220);
      
      // Black bottom banner line
      ctx.fillStyle = '#1a1c23';
      ctx.fillRect(0, 208, w, 12);
    } else if (space.type === 'transport') {
      ctx.fillStyle = '#00e5ff';
      ctx.fillRect(0, 0, w, 160);
      ctx.fillStyle = '#1a1c23';
      ctx.fillRect(0, 148, w, 12);
    } else if (space.type === 'utility') {
      ctx.fillStyle = '#b0bec5';
      ctx.fillRect(0, 0, w, 160);
      ctx.fillStyle = '#1a1c23';
      ctx.fillRect(0, 148, w, 12);
    } else if (space.type === 'start') {
      // Start corner graphics
      ctx.fillStyle = '#00e676';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#1a1c23';
      ctx.lineWidth = 24;
      ctx.strokeRect(0, 0, w, h);

      drawText('START', w / 2, 440, '900 110px Outfit, sans-serif', '#1a1c23');
      drawText('COLLECT ' + (isIndian ? '₹1,500' : '$200'), w / 2, 600, '800 48px Outfit, sans-serif', '#1a1c23');
      drawText('👉', w / 2, 780, '800 100px Outfit, sans-serif', '#1a1c23');
      
      texture.needsUpdate = true;
      return;
    } else if (space.type === 'jail') {
      // Jail corner graphics
      ctx.fillStyle = '#ff1744';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#1a1c23';
      ctx.lineWidth = 24;
      ctx.strokeRect(0, 0, w, h);

      drawText('JAIL', w / 2, 400, '900 110px Outfit, sans-serif', '#1a1c23');
      drawText('JUST VISITING', w / 2, 560, '800 52px Outfit, sans-serif', '#1a1c23');
      drawText('🚓', w / 2, 760, '800 120px Outfit, sans-serif', '#1a1c23');
      
      texture.needsUpdate = true;
      return;
    } else if (space.type === 'club') {
      // Club House / Free Parking
      ctx.fillStyle = isIndian ? '#d500f9' : '#00e5ff';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#1a1c23';
      ctx.lineWidth = 24;
      ctx.strokeRect(0, 0, w, h);

      const words = space.name.split(' ');
      if (words.length > 1) {
        drawText(words[0], w / 2, 360, '900 90px Outfit, sans-serif', '#1a1c23');
        drawText(words[1], w / 2, 460, '900 90px Outfit, sans-serif', '#1a1c23');
      } else {
        drawText(space.name, w / 2, 410, '900 90px Outfit, sans-serif', '#1a1c23');
      }
      
      drawText(isIndian ? 'PARTY FINE' : 'FREE PLACE', w / 2, 600, '800 48px Outfit, sans-serif', '#1a1c23');
      drawText(isIndian ? '🍻' : '🚗', w / 2, 800, '800 120px Outfit, sans-serif', '#1a1c23');
      
      texture.needsUpdate = true;
      return;
    } else if (space.type === 'rest') {
      // Rest House / Go To Jail
      ctx.fillStyle = isIndian ? '#ffd600' : '#ff5252';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#1a1c23';
      ctx.lineWidth = 24;
      ctx.strokeRect(0, 0, w, h);

      const words = space.name.split(' ');
      if (words.length > 1) {
        drawText(words[0], w / 2, 340, '900 85px Outfit, sans-serif', '#1a1c23');
        drawText(words.slice(1).join(' '), w / 2, 440, '900 85px Outfit, sans-serif', '#1a1c23');
      } else {
        drawText(space.name, w / 2, 400, '900 85px Outfit, sans-serif', '#1a1c23');
      }

      drawText(isIndian ? 'LOSE A TURN' : 'GO TO JAIL', w / 2, 580, '800 48px Outfit, sans-serif', '#1a1c23');
      drawText(isIndian ? '🏨' : '🚨', w / 2, 800, '800 130px Outfit, sans-serif', '#1a1c23');
      
      texture.needsUpdate = true;
      return;
    } else if (space.type === 'chance') {
      ctx.fillStyle = '#ffd600';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#1a1c23';
      ctx.lineWidth = 16;
      ctx.strokeRect(0, 0, w, h);
      
      drawText('CHANCE', w / 2, 200, '900 72px Outfit, sans-serif', '#1a1c23');
      drawText('?', w / 2, 640, '900 320px Outfit, sans-serif', '#1a1c23');
      
      texture.needsUpdate = true;
      return;
    } else if (space.type === 'community') {
      ctx.fillStyle = '#29b6f6';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#1a1c23';
      ctx.lineWidth = 16;
      ctx.strokeRect(0, 0, w, h);
      
      drawText('COMMUNITY', w / 2, 150, '900 56px Outfit, sans-serif', '#1a1c23');
      drawText('CHEST', w / 2, 230, '900 56px Outfit, sans-serif', '#1a1c23');
      drawText('💼', w / 2, 620, '900 220px Outfit, sans-serif', '#1a1c23');
      
      texture.needsUpdate = true;
      return;
    } else if (space.type === 'tax') {
      ctx.fillStyle = '#cfd8dc';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#1a1c23';
      ctx.lineWidth = 16;
      ctx.strokeRect(0, 0, w, h);
      
      const words = space.name.split(' ');
      drawText(words[0], w / 2, 300, '900 64px Outfit, sans-serif', '#1a1c23');
      if (words[1]) drawText(words[1], w / 2, 390, '900 64px Outfit, sans-serif', '#1a1c23');
      
      drawText('💸', w / 2, 620, '900 130px Outfit, sans-serif', '#1a1c23');
      drawText(isIndian ? 'Pay ₹' + space.penalty : 'Pay $' + space.penalty, w / 2, 840, '900 48px Outfit, sans-serif', '#1a1c23');
      
      texture.needsUpdate = true;
      return;
    }

    // Write name text for normal properties
    const words = space.name.split(' ');
    if (words.length > 2) {
      drawText(words[0], w / 2, 360, '800 56px Outfit, sans-serif', '#1a1c23');
      drawText(words[1], w / 2, 440, '800 56px Outfit, sans-serif', '#1a1c23');
      drawText(words.slice(2).join(' '), w / 2, 520, '800 56px Outfit, sans-serif', '#1a1c23');
    } else if (words.length > 1) {
      drawText(words[0], w / 2, 400, '800 56px Outfit, sans-serif', '#1a1c23');
      drawText(words.slice(1).join(' '), w / 2, 480, '800 56px Outfit, sans-serif', '#1a1c23');
    } else {
      drawText(space.name, w / 2, 440, '800 56px Outfit, sans-serif', '#1a1c23');
    }

    // Write price if applicable
    if (space.cost > 0) {
      drawText((isIndian ? '₹' : '$') + space.cost.toLocaleString(), w / 2, 840, '900 56px Outfit, sans-serif', '#374151');
    }

    // Draw house count text marker
    if (space.houses > 0) {
      const indicator = space.hotel ? '🏨 HOTEL' : '🏠 ' + '•'.repeat(space.houses);
      drawText(indicator, w / 2, 940, 'bold 48px sans-serif', space.hotel ? '#ff1744' : '#00e676');
    }

    // Tell threejs that the canvas was modified and needs upload
    texture.needsUpdate = true;
  }, [space.name, space.cost, space.houses, space.hotel, space.isMortgaged, isIndian]);

  return textureRef.current;
}

// Subcomponent for rendering individual tiles
function Tile({ space, index, isIndian, onClick }) {
  const meshRef = useRef();
  const texture = useTileTexture(space, index, isIndian);
  const position = getSpaceCoordinates(index);

  // Compute rotation based on side
  const rotation = useMemo(() => {
    if (index >= 0 && index <= 9) return [0, 0, 0]; // Bottom
    if (index > 9 && index <= 18) return [0, Math.PI / 2, 0]; // Left
    if (index > 18 && index <= 27) return [0, Math.PI, 0]; // Top
    return [0, -Math.PI / 2, 0]; // Right
  }, [index]);

  const isCorner = index === 0 || index === 9 || index === 18 || index === 27;
  const size = isCorner ? [1.6, 0.1, 1.6] : [0.85, 0.1, 1.6];

  return (
    <group 
      position={[position[0], 0, position[2]]} 
      rotation={rotation}
      onClick={(e) => {
        e.stopPropagation();
        onClick(space);
      }}
    >
      <mesh ref={meshRef} castShadow receiveShadow>
        <boxGeometry args={size} />
        {/* Multimaterial: apply texture only to top surface (material index 2) */}
        <meshStandardMaterial attach="material-0" color="#1a1c23" roughness={0.7} />
        <meshStandardMaterial attach="material-1" color="#1a1c23" roughness={0.7} />
        <meshStandardMaterial attach="material-2" map={texture} roughness={0.3} metalness={0.05} />
        <meshStandardMaterial attach="material-3" color="#1a1c23" roughness={0.7} />
        <meshStandardMaterial attach="material-4" color="#1a1c23" roughness={0.7} />
        <meshStandardMaterial attach="material-5" color="#1a1c23" roughness={0.7} />
      </mesh>

      {/* Render physical house/hotel models on top of tile */}
      {space.houses > 0 && (
        <group position={[0, 0.08, 0.35]}>
          {space.hotel ? (
            // Hotel
            <mesh position={[0, 0.1, 0]}>
              <boxGeometry args={[0.22, 0.22, 0.22]} />
              <meshStandardMaterial color="#ff1744" roughness={0.3} />
            </mesh>
          ) : (
            // Houses
            <group>
              {Array.from({ length: space.houses }).map((_, i) => (
                <mesh key={i} position={[(i - (space.houses - 1) / 2) * 0.18, 0.06, 0]}>
                  <boxGeometry args={[0.12, 0.12, 0.12]} />
                  <meshStandardMaterial color="#00e676" roughness={0.3} />
                </mesh>
              ))}
            </group>
          )}
        </group>
      )}
    </group>
  );
}

export default function Board3D() {
  const { boardSpaces, boardTheme, setSelectedProperty } = useGame();
  const isIndian = boardTheme === 'INDIAN_BUSINESS';

  return (
    <group>
      {/* 3D Board Floor Base - warm cream board frame */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]} receiveShadow>
        <planeGeometry args={[11.5, 11.5]} />
        <meshStandardMaterial color="#e7e5e4" roughness={0.8} />
      </mesh>

      {/* Board Center Plate - cream interior plate with brutalist borders */}
      <mesh position={[0, -0.01, 0]} receiveShadow>
        <boxGeometry args={[6.8, 0.06, 6.8]} />
        <meshStandardMaterial color="#faf9f6" roughness={0.7} metalness={0.02} />
      </mesh>
      
      {/* Brutalist Center Plate Inner Border Outline */}
      <mesh position={[0, 0.022, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
        <ringGeometry args={[3.22, 3.25, 4, 1, 0, Math.PI * 2]} />
        <meshBasicMaterial color="#1a1c23" side={THREE.DoubleSide} />
      </mesh>

      {/* Grid of Board Tiles */}
      {boardSpaces.map((space, index) => (
        <Tile 
          key={space.id} 
          space={space} 
          index={index} 
          isIndian={isIndian} 
          onClick={setSelectedProperty}
        />
      ))}
    </group>
  );
}
