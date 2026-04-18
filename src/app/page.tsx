'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { GameShell } from '@/components/GameShell';
import { SplashScreen } from '@/components/SplashScreen';
import { DifficultySelect } from '@/components/DifficultySelect';
import { GameBoard } from '@/components/GameBoard';
import { VictoryScreen } from '@/components/VictoryScreen';
import { Leaderboard } from '@/components/Leaderboard';
import { Tutorial } from '@/components/Tutorial';
import { PaymentGate } from '@/components/PaymentGate';

export default function Home() {
  const { screen, tick, goTo, startGame } = useGameStore();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => tick(), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current!); };
  }, [tick]);

  // Handle incoming deeplink parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const screen = params.get('screen');
    const diff = params.get('diff');
    // @ts-ignore
    const score = params.get('score');

    if (screen === 'leaderboard') {
      goTo('leaderboard');
    } else if (diff) {
      const sizeMap: Record<string, number> = {
        novice: 5, easy: 6, medium: 6, hard: 8, expert: 9, master: 9
      };
      goTo('difficulty');
      // Auto-start after a short delay so the AlienProvider is ready
      setTimeout(() => {
        startGame(sizeMap[diff] ?? 5, diff);
      }, 800);
    }
  }, []); // eslint-disable-line

  const renderScreen = () => {
    switch (screen) {
      case 'splash':      return <SplashScreen />;
      case 'difficulty':  return <DifficultySelect />;
      case 'game':        return (
        <PaymentGate onTrialGranted={() => {}}>
          <GameBoard />
        </PaymentGate>
      );
      case 'victory':     return <VictoryScreen />;
      case 'leaderboard': return <Leaderboard />;
      case 'tutorial':    return <Tutorial onClose={() => goTo('splash')} />;
      default:            return <SplashScreen />;
    }
  };

  return (
    <GameShell>
      {renderScreen()}
    </GameShell>
  );
}
