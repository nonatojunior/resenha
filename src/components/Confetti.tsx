import { useMemo } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

const COLORS = ['#FFD166', '#FF4D8D', '#39D98A', '#FF8A3D', '#B794F6', '#FFF8EE'];

export function Confetti({ pieces = 44 }: { pieces?: number }) {
  const reducedMotion = useReducedMotion();

  const confetti = useMemo(
    () =>
      Array.from({ length: pieces }, (_, index) => ({
        id: index,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 2.2}s`,
        duration: `${3.2 + Math.random() * 2.4}s`,
        color: COLORS[index % COLORS.length],
        width: `${6 + Math.random() * 8}px`,
        height: `${10 + Math.random() * 10}px`,
        rotate: `${Math.random() * 180}deg`,
      })),
    [pieces],
  );

  if (reducedMotion) return null;

  return (
    <div className="confetti" aria-hidden="true">
      {confetti.map((piece) => (
        <span
          key={piece.id}
          style={{
            left: piece.left,
            animationDelay: piece.delay,
            animationDuration: piece.duration,
            backgroundColor: piece.color,
            width: piece.width,
            height: piece.height,
            transform: `rotate(${piece.rotate})`,
          }}
        />
      ))}
    </div>
  );
}
