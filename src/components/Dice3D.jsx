import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { CanvasTexture } from 'three';
import * as THREE from 'three';
import { useGame } from '../context/GameContext';

// Generate canvas texture for a die face with dots
function createDieFaceTexture(number) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 128, 128);

  // Border (subtle)
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, 128, 128);

  // Dot drawing helper
  const drawDot = (x, y) => {
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#111827';
    ctx.fill();
  };

  const center = 64;
  const low = 32;
  const high = 96;

  switch (number) {
    case 1:
      drawDot(center, center);
      break;
    case 2:
      drawDot(low, low);
      drawDot(high, high);
      break;
    case 3:
      drawDot(low, low);
      drawDot(center, center);
      drawDot(high, high);
      break;
    case 4:
      drawDot(low, low);
      drawDot(low, high);
      drawDot(high, low);
      drawDot(high, high);
      break;
    case 5:
      drawDot(low, low);
      drawDot(low, high);
      drawDot(center, center);
      drawDot(high, low);
      drawDot(high, high);
      break;
    case 6:
      drawDot(low, low);
      drawDot(low, center);
      drawDot(low, high);
      drawDot(high, low);
      drawDot(high, center);
      drawDot(high, high);
      break;
    default:
      break;
  }

  return new CanvasTexture(canvas);
}

// Target Euler rotations to orient the correct face pointing upwards (Z-up / Y-up in ThreeJS)
// Assuming top face of the box is index 2 (+Y face)
const FACE_ROTATIONS = {
  1: [0, 0, 0],                  // 1 on top
  2: [Math.PI, 0, 0],            // 2 on top
  3: [0, 0, Math.PI / 2],        // 3 on top
  4: [0, 0, -Math.PI / 2],       // 4 on top
  5: [-Math.PI / 2, 0, 0],       // 5 on top
  6: [Math.PI / 2, 0, 0],        // 6 on top
};

function SingleDie({ value, rolling, offset }) {
  const meshRef = useRef();

  // Physics simulation variables
  const physics = useRef({
    position: new THREE.Vector3(offset, 1.5, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    rotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0),
    spin: new THREE.Vector3(0, 0, 0),
  });

  // Re-roll trigger: give random upward impulse and rotation torque
  useEffect(() => {
    if (rolling) {
      physics.current.position.set(offset + (Math.random() - 0.5) * 0.4, 2.0, (Math.random() - 0.5) * 0.4);
      physics.current.velocity.set((Math.random() - 0.5) * 4, 3 + Math.random() * 3, (Math.random() - 0.5) * 4);
      physics.current.spin.set(Math.random() * 15, Math.random() * 15, Math.random() * 15);
    }
  }, [rolling]);

  // Texture maps for 6 faces: Right, Left, Top (+Y), Bottom (-Y), Front (+Z), Back (-Z)
  // Let's map standard numbers to each face index
  const faceTextures = useMemo(() => [
    createDieFaceTexture(3), // Face 0: +X (Right)
    createDieFaceTexture(4), // Face 1: -X (Left)
    createDieFaceTexture(1), // Face 2: +Y (Top) - our target face!
    createDieFaceTexture(2), // Face 3: -Y (Bottom)
    createDieFaceTexture(5), // Face 4: +Z (Front)
    createDieFaceTexture(6), // Face 5: -Z (Back)
  ], []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const limit = Math.min(delta, 0.1); // clamp delta
    const phys = physics.current;

    if (rolling) {
      // 1. Physics update
      // Apply gravity
      phys.velocity.y -= 9.8 * limit;
      
      // Update position
      phys.position.addScaledVector(phys.velocity, limit);

      // Bounce on floor (y = 0.15 is dice height radius)
      if (phys.position.y < 0.15) {
        phys.position.y = 0.15;
        phys.velocity.y = -phys.velocity.y * 0.45; // Bounce restitution
        
        // Add random horizontal spin on bounce
        phys.velocity.x += (Math.random() - 0.5) * 1.5;
        phys.velocity.z += (Math.random() - 0.5) * 1.5;
        
        // Spin bounce torque
        phys.spin.set(
          phys.spin.x * -0.5 + (Math.random() - 0.5) * 10,
          phys.spin.y * -0.5 + (Math.random() - 0.5) * 10,
          phys.spin.z * -0.5 + (Math.random() - 0.5) * 10
        );
      }

      // Check walls containment (within board center area)
      const wallLimit = 1.8;
      if (Math.abs(phys.position.x) > wallLimit) {
        phys.position.x = Math.sign(phys.position.x) * wallLimit;
        phys.velocity.x = -phys.velocity.x * 0.5;
      }
      if (Math.abs(phys.position.z) > wallLimit) {
        phys.position.z = Math.sign(phys.position.z) * wallLimit;
        phys.velocity.z = -phys.velocity.z * 0.5;
      }

      // Update rotation
      phys.rotation.x += phys.spin.x * limit;
      phys.rotation.y += phys.spin.y * limit;
      phys.rotation.z += phys.spin.z * limit;

      // Apply to mesh
      meshRef.current.position.copy(phys.position);
      meshRef.current.rotation.copy(phys.rotation);
    } else {
      // 2. Roll completed: Slerp towards static final rotation matching the die value
      const targetEuler = FACE_ROTATIONS[value] || [0, 0, 0];
      const targetQuaternion = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(targetEuler[0], targetEuler[1], targetEuler[2])
      );

      // Lerp position to flat floor
      const restPos = new THREE.Vector3(offset, 0.1, 0);
      meshRef.current.position.lerp(restPos, 0.12);

      // Slerp rotation to show face upwards
      meshRef.current.quaternion.slerp(targetQuaternion, 0.12);

      // Keep physics state synchronized with visual state
      phys.position.copy(meshRef.current.position);
      phys.rotation.setFromQuaternion(meshRef.current.quaternion);
    }
  });

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      <boxGeometry args={[0.22, 0.22, 0.22]} />
      {faceTextures.map((tex, idx) => (
        <meshStandardMaterial 
          key={idx} 
          attach={`material-${idx}`} 
          map={tex} 
          roughness={0.15} 
          metalness={0.05} 
        />
      ))}
    </mesh>
  );
}

export default function Dice3D() {
  const { dice, diceRolling } = useGame();

  return (
    <group>
      {/* Die 1 */}
      <SingleDie value={dice[0]} rolling={diceRolling} offset={-0.3} />
      {/* Die 2 */}
      <SingleDie value={dice[1]} rolling={diceRolling} offset={0.3} />
    </group>
  );
}
