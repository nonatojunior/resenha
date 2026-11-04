import { Check } from 'lucide-react';
import type { RoomStatus } from '../../types/game';

const STEPS = ['Convidar', 'Votar', 'Encerrar', 'Revelar'] as const;

function currentStep(status: RoomStatus): number {
  if (status === 'lobby') return 0;
  if (status === 'voting') return 1;
  if (status === 'closed') return 2;
  return 3;
}

export function RoomSteps({ status }: { status: RoomStatus }) {
  const current = currentStep(status);
  const archived = status === 'archived';

  return (
    <ol className="room-steps" aria-label="Etapas da resenha">
      {STEPS.map((step, index) => {
        const done = archived || index < current;
        const active = !archived && index === current;
        return (
          <li
            key={step}
            className={`room-steps__item ${done ? 'is-done' : ''} ${active ? 'is-active' : ''}`}
            aria-current={active ? 'step' : undefined}
          >
            <span className="room-steps__number">{done ? <Check size={15} /> : index + 1}</span>
            <span>{step}</span>
          </li>
        );
      })}
    </ol>
  );
}
