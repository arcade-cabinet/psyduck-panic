'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import ATCShader from '@/components/ui/atc-shader';
import { useAudioStore } from '@/store/audio-store';
import { useGameStore } from '@/store/game-store';
import { useInputStore } from '@/store/input-store';
import { useLevelStore } from '@/store/level-store';
import { useSeedStore } from '@/store/seed-store';

const GameScene = dynamic(() => import('@/components/game-scene'), { ssr: false });

export default function GameBoard() {
  const [showTitle, setShowTitle] = useState(true);
  const [titleOpacity, setTitleOpacity] = useState(1);
  const [showGameOver, setShowGameOver] = useState(false);
  const [gameOverOpacity, setGameOverOpacity] = useState(0);
  const [showClarity, setShowClarity] = useState(false);
  const [clarityOpacity, setClarityOpacity] = useState(0);

  const tension = useLevelStore((s) => s.tension);
  const coherence = useLevelStore((s) => s.coherence);
  const initialize = useAudioStore((s) => s.initialize);
  const _phase = useGameStore((s) => s.phase);

  const handleRestart = useCallback(() => {
    useLevelStore.getState().reset();
    useSeedStore.getState().generateNewSeed();
    useGameStore.getState().setPhase('playing');
    setShowGameOver(false);
    setGameOverOpacity(0);
  }, []);

  // Opening title sizzle
  useEffect(() => {
    const timer = setTimeout(() => {
      setTitleOpacity(0);
      setTimeout(() => setShowTitle(false), 900);
    }, 2400);
    return () => clearTimeout(timer);
  }, []);

  // Initialize audio on first interaction
  useEffect(() => {
    const handleClick = () => {
      initialize();
      window.removeEventListener('click', handleClick);
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [initialize]);

  // Game over listener
  useEffect(() => {
    const handleGameOver = () => {
      setShowGameOver(true);
      setGameOverOpacity(1);
    };
    window.addEventListener('gameOver', handleGameOver);
    return () => window.removeEventListener('gameOver', handleGameOver);
  }, []);

  // Moment of clarity listener — brief "COHERENCE MAINTAINED" flash
  useEffect(() => {
    const handleClarity = () => {
      setShowClarity(true);
      setClarityOpacity(1);
      // Fade out after 2 seconds
      const fadeTimer = setTimeout(() => {
        setClarityOpacity(0);
        const hideTimer = setTimeout(() => setShowClarity(false), 900);
        return () => clearTimeout(hideTimer);
      }, 2000);
      return () => clearTimeout(fadeTimer);
    };
    window.addEventListener('coherenceMaintained', handleClarity);
    return () => window.removeEventListener('coherenceMaintained', handleClarity);
  }, []);

  // Sync tension to audio store
  useEffect(() => {
    useAudioStore.getState().updateTension(tension);
  }, [tension]);

  // Expose Zustand stores on window for E2E test bridge
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const w = window as Window & {
        __zustand_level?: typeof useLevelStore;
        __zustand_input?: typeof useInputStore;
        __zustand_game?: typeof useGameStore;
        __zustand_seed?: typeof useSeedStore;
      };
      w.__zustand_level = useLevelStore;
      w.__zustand_input = useInputStore;
      w.__zustand_game = useGameStore;
      w.__zustand_seed = useSeedStore;
    }
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* ATC Shader Background */}
      <ATCShader className="z-0" />

      {/* Opening Title Sizzle */}
      {showTitle && (
        <div
          data-testid="title-overlay"
          className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 transition-opacity duration-900"
          style={{ opacity: titleOpacity }}
        >
          <div className="text-center">
            <h1 className="font-mono text-[92px] tracking-[12px] text-white">COGNITIVE</h1>
            <h1 className="font-mono text-[92px] tracking-[12px] text-red-500 -mt-6">DISSONANCE</h1>
          </div>
        </div>
      )}

      {/* Moment of Clarity — brief flash when coherence hits 100 */}
      {showClarity && (
        <div
          data-testid="clarity-overlay"
          className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none transition-opacity duration-900"
          style={{ opacity: clarityOpacity }}
        >
          <h1 className="font-mono text-[48px] tracking-[8px] text-blue-400/80">COHERENCE MAINTAINED</h1>
        </div>
      )}

      {/* Game Over — Symmetric Static Close (click to restart) */}
      {showGameOver && (
        <div
          data-testid="gameover-overlay"
          className="absolute inset-0 z-30 flex items-center justify-center bg-black/90 transition-opacity duration-1200 cursor-pointer"
          style={{ opacity: gameOverOpacity }}
          onClick={handleRestart}
        >
          <div className="text-center">
            <h1 className="font-mono text-[92px] tracking-[12px] text-red-500">COGNITION</h1>
            <h1 className="font-mono text-[92px] tracking-[12px] text-white -mt-6">SHATTERED</h1>
            <div className="mt-12 text-white/60 font-mono text-2xl">The sphere has broken.</div>
            <div className="mt-8 text-white/40 font-mono text-sm">Click anywhere to dream again</div>
          </div>
        </div>
      )}

      {/* 3D Game Layer */}
      <div className="absolute inset-0 z-10">
        <GameScene coherence={coherence} />
      </div>
    </div>
  );
}
