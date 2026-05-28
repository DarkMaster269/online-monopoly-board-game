import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../context/GameContext';
import { getSpaceCoordinates } from './Board3D';

export default function CameraController({ controlsRef }) {
  const { camera, gl, pointer } = useThree();
  const { players, turnIndex, pawnMoving, diceRolling, selectedProperty, boardSpaces } = useGame();

  // State machine: 'free' | 'focusing_dice' | 'focusing_pawn' | 'focusing_property' | 'returning_overview' | 'returning_property'
  const behaviorState = useRef('free');

  // Default camera configurations (center overview)
  const defaultTarget = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const defaultCamPos = useMemo(() => new THREE.Vector3(0, 9, 8), []);

  // Compute camera position and target relative to a board space index
  const getPawnTargetAndPos = useMemo(() => {
    return (positionIndex, zoomIn = false) => {
      const coord = getSpaceCoordinates(positionIndex);
      const targetX = coord[0];
      const targetZ = coord[2];
      
      // Angle from center of the board to the tile
      const angle = Math.atan2(targetZ, targetX);
      
      // Close-up zoom distance
      const dist = zoomIn ? 3.6 : 6.0;
      const height = zoomIn ? 3.5 : 5.8;
      
      const camX = targetX + Math.cos(angle) * dist;
      const camZ = targetZ + Math.sin(angle) * dist;
      
      return {
        target: new THREE.Vector3(targetX, 0, targetZ),
        position: new THREE.Vector3(camX, height, camZ)
      };
    };
  }, []);

  // Selected property index on click focus
  const selectedSpaceIndex = useMemo(() => {
    if (!selectedProperty) return -1;
    return boardSpaces.findIndex(s => s.id === selectedProperty.id);
  }, [selectedProperty, boardSpaces]);

  // Track movement state transitions & landing pause timing
  const prevPawnMoving = useRef(false);
  const pawnLandingTime = useRef(0);

  useEffect(() => {
    if (!pawnMoving && prevPawnMoving.current) {
      // Pawn just landed! Record timestamp
      pawnLandingTime.current = Date.now();
    }
    prevPawnMoving.current = pawnMoving;
  }, [pawnMoving]);

  // Zoom-to-Cursor interaction logic: Shifts the controls target to the mouse pointer location
  // so zooming is centered exactly on the cursor rather than a locked point.
  useEffect(() => {
    const dom = gl.domElement;
    const raycaster = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // Y=0 ground board plane
    
    const handleWheel = () => {
      const controls = controlsRef.current;
      // Only modify target when user has manual control ('free' state)
      if (!controls || behaviorState.current !== 'free') return;

      // raycast from screen mouse pointer to the board plane
      raycaster.setFromCamera(pointer, camera);
      const intersection = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(plane, intersection)) {
        // Shift target only if the mouse is hovering within the board boundaries (radius < 8.0 units)
        if (intersection.length() < 8.0) {
          const shift = new THREE.Vector3().copy(intersection).sub(controls.target);
          // Shift both camera and target by the same delta vector to move the orbit pivot with zero image jump
          camera.position.add(shift);
          controls.target.copy(intersection);
          controls.update();
        }
      }
    };

    dom.addEventListener('wheel', handleWheel, { passive: true });
    return () => {
      dom.removeEventListener('wheel', handleWheel);
    };
  }, [gl, pointer, camera, controlsRef]);

  useFrame((state, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    const activePlayer = players[turnIndex];
    if (!activePlayer || activePlayer.isBankrupt) return;

    // Main state transitions
    if (diceRolling && behaviorState.current !== 'focusing_dice') {
      behaviorState.current = 'focusing_dice';
    } 
    else if (pawnMoving && behaviorState.current !== 'focusing_pawn') {
      behaviorState.current = 'focusing_pawn';
    } 
    else if (!pawnMoving && !diceRolling) {
      if (selectedSpaceIndex !== -1 && behaviorState.current !== 'focusing_property') {
        behaviorState.current = 'focusing_property';
      } else if (selectedSpaceIndex === -1 && behaviorState.current === 'focusing_property') {
        behaviorState.current = 'returning_property';
      }
    }

    // Delay transition back to overview after pawn lands (gives 1 second pause)
    if (behaviorState.current === 'focusing_pawn' && !pawnMoving) {
      if (pawnLandingTime.current > 0 && Date.now() - pawnLandingTime.current > 1000) {
        pawnLandingTime.current = 0; // Reset timer
        behaviorState.current = 'returning_overview';
      }
    }

    // Execute state behaviors
    if (behaviorState.current === 'focusing_dice') {
      const diceTarget = new THREE.Vector3(0, 0, 0);
      const dicePos = new THREE.Vector3(0, 6.0, 5.0); // Focused center angled view

      controls.target.lerp(diceTarget, 0.08);
      camera.position.lerp(dicePos, 0.08);
      controls.update();
    }
    else if (behaviorState.current === 'focusing_pawn') {
      // Zoom close-up on moving pawn
      const config = getPawnTargetAndPos(activePlayer.position, true);
      
      controls.target.lerp(config.target, 0.08);
      camera.position.lerp(config.position, 0.08);
      controls.update();
    }
    else if (behaviorState.current === 'focusing_property' && selectedSpaceIndex !== -1) {
      // Focus close-up on clicked property card detail
      const config = getPawnTargetAndPos(selectedSpaceIndex, true);

      controls.target.lerp(config.target, 0.08);
      camera.position.lerp(config.position, 0.08);
      controls.update();
    }
    else if (behaviorState.current === 'returning_overview') {
      // Return target to the center [0, 0, 0] and zoom out to center overview
      controls.target.lerp(defaultTarget, 0.08);
      camera.position.lerp(defaultCamPos, 0.08);
      controls.update();

      const distToTarget = controls.target.distanceTo(defaultTarget);
      const distToCam = camera.position.distanceTo(defaultCamPos);

      if (distToTarget < 0.04 && distToCam < 0.04) {
        controls.target.copy(defaultTarget);
        camera.position.copy(defaultCamPos);
        controls.update();
        behaviorState.current = 'free'; // Hand manual orbit control back centered on center dice
      }
    }
    else if (behaviorState.current === 'returning_property') {
      // Return focus to center overview on detail close
      controls.target.lerp(defaultTarget, 0.08);
      camera.position.lerp(defaultCamPos, 0.08);
      controls.update();

      const distToTarget = controls.target.distanceTo(defaultTarget);
      const distToCam = camera.position.distanceTo(defaultCamPos);

      if (distToTarget < 0.04 && distToCam < 0.04) {
        controls.target.copy(defaultTarget);
        camera.position.copy(defaultCamPos);
        controls.update();
        behaviorState.current = 'free';
      }
    }
  });

  return null;
}
