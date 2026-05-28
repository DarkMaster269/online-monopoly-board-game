import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { GameProvider, useGame } from './context/GameContext';
import Lobby from './components/Lobby';
import GameHUD from './components/GameHUD';
import Board3D from './components/Board3D';
import Pawn3D from './components/Pawn3D';
import Dice3D from './components/Dice3D';
import CameraController from './components/CameraController';

function AppContent() {
  const { gameStarted } = useGame();
  const controlsRef = useRef();

  if (!gameStarted) {
    return <Lobby />;
  }

  return (
    <div style={styles.container}>
      {/* 3D Game Board Viewport */}
      <Canvas
        shadows
        camera={{ position: [0, 9, 8], fov: 50 }}
        style={styles.canvas}
      >
        <color attach="background" args={['#FAFaf9']} />
        
        {/* Cozy Warm Studio Lighting */}
        <ambientLight intensity={0.8} />
        
        <directionalLight
          castShadow
          position={[5, 12, 5]}
          intensity={1.8}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={25}
          shadow-camera-left={-7}
          shadow-camera-right={7}
          shadow-camera-top={7}
          shadow-camera-bottom={-7}
          shadow-bias={-0.0005}
        />

        <pointLight position={[-6, 4, -6]} intensity={0.6} color="#70e497" />
        <pointLight position={[6, 4, 6]} intensity={0.6} color="#f9d342" />

        {/* Game Components */}
        <Board3D />
        <Pawn3D />
        <Dice3D />

        {/* Cinematic Autofocus Camera Controller */}
        <CameraController controlsRef={controlsRef} />

        {/* Camera orbit, tilt, and zoom controls */}
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enablePan={true}
          enableZoom={true}
          minDistance={5}
          maxDistance={14}
          maxPolarAngle={Math.PI / 2.1} // Prevent going below the board floor
        />
      </Canvas>

      {/* 2D HUD overlays */}
      <GameHUD />
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}

const styles = {
  container: {
    width: '100vw',
    height: '100vh',
    position: 'relative',
    overflow: 'hidden',
  },
  canvas: {
    width: '100%',
    height: '100%',
    outline: 'none',
  },
};
