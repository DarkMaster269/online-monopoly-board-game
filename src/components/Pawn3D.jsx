import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { getSpaceCoordinates } from './Board3D';
import * as THREE from 'three';
import { useGame } from '../context/GameContext';

const TOKEN_COLORS = [
  '#82e3b2', // mint
  '#ff9b85', // coral
  '#ffd15c', // sun
  '#8ad3ff', // sky
  '#d8acff', // grape
  '#ffa2b2'  // rose
];

// Offset calculation to prevent clipping when multiple pawns land on the same tile
function getPawnOffset(playerIndex) {
  const offsets = [
    [-0.2, 0, -0.2], // Player 0: Bottom-left of tile
    [0.2, 0, -0.2],  // Player 1: Bottom-right of tile
    [-0.2, 0, 0.2],  // Player 2: Top-left of tile
    [0.2, 0, 0.2]    // Player 3: Top-right of tile
  ];
  return offsets[playerIndex % offsets.length];
}

function PlayerPawn({ player, index }) {
  const groupRef = useRef();

  // Target coordinates
  const targetPos = getSpaceCoordinates(player.position);
  const offset = getPawnOffset(index);
  const targetX = targetPos[0] + offset[0];
  const targetZ = targetPos[2] + offset[2];

  // Initialize visual position to target immediately on load
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(targetX, 0.08, targetZ);
    }
  }, []);

  // Frame-loop interpolation for smooth slide and jump
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const currentX = groupRef.current.position.x;
    const currentZ = groupRef.current.position.z;

    // Calculate distance to target
    const dx = targetX - currentX;
    const dz = targetZ - currentZ;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist > 0.01) {
      // Lerp X and Z positions
      groupRef.current.position.x += dx * 0.25;
      groupRef.current.position.z += dz * 0.25;

      // Hops: Add vertical bounce curve (Y) based on distance
      // As distance closes, height reaches peak and then lands
      const peakHeight = 0.55;
      const height = Math.sin((1 - Math.min(dist / 0.9, 1)) * Math.PI) * peakHeight;
      groupRef.current.position.y = 0.08 + height;
    } else {
      // Snap to target exactly
      groupRef.current.position.x = targetX;
      groupRef.current.position.z = targetZ;
      groupRef.current.position.y = 0.08;
    }
  });

  const pColor = TOKEN_COLORS[player.token % TOKEN_COLORS.length];

  return (
    <group ref={groupRef}>
      {/* 3D Glass/Metallic Pawn Model */}
      <mesh castShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.04, 16]} />
        <meshPhysicalMaterial 
          color={pColor} 
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>
      
      <mesh castShadow position={[0, 0.16, 0]}>
        <coneGeometry args={[0.09, 0.28, 16]} />
        <meshPhysicalMaterial 
          color={pColor} 
          roughness={0.05} 
          transmission={0.6}
          thickness={0.5}
        />
      </mesh>

      <mesh castShadow position={[0, 0.32, 0]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshPhysicalMaterial 
          color={pColor} 
          roughness={0.05} 
          transmission={0.8}
          thickness={0.8}
        />
      </mesh>

      {/* Subtle indicator ring below active player's pawn */}
      {player.inJail && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
          <ringGeometry args={[0.16, 0.19, 16]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
      )}
    </group>
  );
}

export default function Pawn3D() {
  const { players } = useGame();
  
  // Render active non-bankrupt players
  return (
    <group>
      {players
        .filter(p => !p.isBankrupt)
        .map((p, idx) => (
          <PlayerPawn key={p.id} player={p} index={idx} />
        ))}
    </group>
  );
}
